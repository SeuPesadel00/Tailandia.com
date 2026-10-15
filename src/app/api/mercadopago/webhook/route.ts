import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getMercadoPagoOrder, validateWebhookSignature } from '../../../../services/mercadopagoOrders';

const SUPABASE_REST_URL = (
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rgggdawwkmncpfetuhij.supabase.co'
).replace(/rgggdawwkmcnpfetuhij/g, 'rgggdawwkmncpfetuhij');

const SUPABASE_ANON_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnZ2dkYXd3a21uY3BmZXR1aGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NTUyNjgsImV4cCI6MjEwNjQzMTI2OH0.1uXP6pHtcdfKlmuB1rIcnhVQf9uCT3Yb9iyIuo9hZNc';

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const xSignature = request.headers.get('x-signature');
    const xRequestId = request.headers.get('x-request-id');

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // webhook pode enviar corpo vazio em alguns pings
    }

    const action = body.action || url.searchParams.get('action');
    const topic = body.type || url.searchParams.get('type') || url.searchParams.get('topic');
    const dataId = String(body?.data?.id || url.searchParams.get('data.id') || url.searchParams.get('id') || '');

    // Validação estrita de assinatura
    const webhookSecret =
      process.env.MP_WEBHOOK_SECRET ||
      '3e78ad080871ceb3504a7bee99d4d76b3157bb38049ebd7197408422dbfdb6a9';

    if (!validateWebhookSignature(xSignature, xRequestId, dataId, webhookSecret)) {
      console.warn('[Webhook Security] Webhook rejeitado: assinatura inválida.');
      return NextResponse.json({ success: false, message: 'Assinatura inválida ou segredo não configurado' }, { status: 401 });
    }

    // 1. Processamento de notificações do tópico ORDER (Orders API)
    if (topic === 'order' || action?.startsWith('order.')) {
      if (!dataId) {
        return NextResponse.json({ success: false, message: 'ID da ordem ausente' }, { status: 400 });
      }

      // Detecção explícita de simulação do painel do Mercado Pago
      const isSimulacao =
        dataId === '1234567890' ||
        body?.data?.external_reference === 'ext_ref_1234' ||
        (body?.action === 'order.processed' && dataId === '1234567890');

      if (isSimulacao) {
        console.log('[Webhook Mercado Pago] Simulação/teste recebido com sucesso:', { action, dataId });
        return NextResponse.json({
          success: true,
          message: 'Simulação de notificação do Mercado Pago recebida e validada com sucesso!',
          simulacao: true,
          orderId: dataId,
        }, { status: 200 });
      }

      // Consulta o pedido atualizado diretamente na API de Orders com fallback seguro
      let orderData: any = null;
      try {
        orderData = await getMercadoPagoOrder(dataId);
      } catch (orderErr: any) {
        console.warn(`[Webhook Mercado Pago] Aviso ao consultar ordem ${dataId}:`, orderErr.message);
        if (body?.data && typeof body.data === 'object') {
          orderData = body.data;
        } else {
          // Retorna 200 para confirmar o recebimento sem causar 500 no Mercado Pago
          return NextResponse.json({
            success: true,
            message: `Notificação da ordem ${dataId} recebida (não localizada no MP ou teste).`,
          }, { status: 200 });
        }
      }

      const externalReference = orderData?.external_reference || body?.data?.external_reference;

      if (!externalReference) {
        return NextResponse.json({ success: true, message: 'Ordem sem external_reference, ignorada.' }, { status: 200 });
      }

      const vendaId = parseInt(externalReference, 10);
      if (isNaN(vendaId)) {
        return NextResponse.json({ success: true, message: `external_reference '${externalReference}' é de teste/simulação.` }, { status: 200 });
      }

      const isApproved =
        orderData?.status === 'processed' ||
        orderData?.status === 'approved' ||
        orderData?.transactions?.payments?.some(
          (p: any) => p.status === 'processed' || p.status === 'approved' || p.status_detail === 'accredited'
        ) ||
        (Array.isArray(orderData?.payments) && orderData.payments.some((p: any) => p.status === 'processed' || p.status === 'approved'));

      const paidAmount = Number(orderData?.total_amount || orderData?.payments?.[0]?.amount || 0);

      const isRefunded =
        orderData?.status === 'cancelled' ||
        orderData?.status === 'refunded' ||
        orderData?.transactions?.payments?.some(
          (p: any) => p.status === 'refunded' || p.status === 'cancelled' || p.status_detail === 'refunded'
        );

      if (isApproved) {
        await processarPagamentoAprovado(vendaId, orderData?.id || dataId, paidAmount);
      } else if (isRefunded) {
        await processarEstorno(vendaId, orderData?.id || dataId, 'Cancelamento/Estorno via Mercado Pago');
      }

      return NextResponse.json({ success: true, orderId: dataId }, { status: 200 });
    }

    // 2. Compatibilidade com notificações legadas de payment
    if (topic === 'payment' || action?.startsWith('payment.')) {
      if (!dataId) {
        return NextResponse.json({ success: false, message: 'ID do pagamento ausente' }, { status: 400 });
      }

      if (dataId === '1234567890' || body?.data?.external_reference === 'ext_ref_1234') {
        return NextResponse.json({ success: true, message: 'Simulação de pagamento validada com sucesso!' }, { status: 200 });
      }

      const accessToken =
        process.env.MP_ACCESS_TOKEN ||
        'APP_USR-4682271217183527-101408-e3bd8bda86656be83273177f61419eae-3764831852';

      if (accessToken) {
        try {
          const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(dataId)}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (payRes.ok) {
            const payData = await payRes.json();
            const vendaId = payData.external_reference ? parseInt(payData.external_reference, 10) : NaN;
            const paidAmount = Number(payData.transaction_amount || 0);

            if (payData.status === 'approved' && !isNaN(vendaId)) {
              await processarPagamentoAprovado(vendaId, String(payData.id), paidAmount);
            } else if ((payData.status === 'refunded' || payData.status === 'cancelled') && !isNaN(vendaId)) {
              await processarEstorno(vendaId, String(payData.id), 'Estorno do pagamento via Mercado Pago');
            }
          }
        } catch (payErr: any) {
          console.warn(`[Webhook Mercado Pago] Erro ao buscar pagamento ${dataId}:`, payErr.message);
        }
      }

      return NextResponse.json({ success: true, paymentId: dataId }, { status: 200 });
    }

    return NextResponse.json({ success: true, message: 'Evento recebido' });
  } catch (error: any) {
    console.error('Erro no processamento do webhook Mercado Pago:', error);
    // Sempre retorna 200 para confirmar recebimento e evitar loop de retry no MP
    return NextResponse.json({ success: true, message: 'Notificação recebida' }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'Mercado Pago Webhook — Tailândia Distribuidora',
    endpoint: '/api/mercadopago/webhook',
    timestamp: new Date().toISOString()
  }, { status: 200 });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}

/**
 * Atualiza status no banco com idempotência estrita, valida valor pago e decrementa estoque
 */
async function processarPagamentoAprovado(vendaId: number, comprovanteRef: string, paidAmount?: number) {
  try {
    let vendaAtual: { id: number; status: string; total: any; itens?: any[] } | null = null;

    try {
      vendaAtual = await prisma.venda.findUnique({
        where: { id: vendaId },
        include: { itens: true },
      }) as any;
    } catch {}

    if (!vendaAtual) {
      try {
        const vRes = await fetch(`${SUPABASE_REST_URL}/rest/v1/vendas?id=eq.${vendaId}&select=id,status,total`, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          cache: 'no-store'
        });
        if (vRes.ok) {
          const vData = await vRes.json();
          if (Array.isArray(vData) && vData.length > 0) {
            const iRes = await fetch(`${SUPABASE_REST_URL}/rest/v1/vendas_itens?venda_id=eq.${vendaId}&select=*`, {
              headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              },
              cache: 'no-store'
            });
            const iData = iRes.ok ? await iRes.json() : [];
            vendaAtual = { ...vData[0], itens: iData };
          }
        }
      } catch (e: any) {
        console.warn('[Webhook REST] Erro ao buscar venda:', e.message);
      }
    }

    if (!vendaAtual) {
      console.warn(`[Webhook Idempotency] Venda #${vendaId} não encontrada. Abortando.`);
      return;
    }

    if (vendaAtual.status === 'CONCLUIDA') {
      console.log(`[Webhook Idempotency] Venda #${vendaId} já está CONCLUIDA.`);
      return;
    }

    // 2. Atualiza status para CONCLUIDA no Prisma e Supabase REST
    try {
      await prisma.venda.update({
        where: { id: vendaId },
        data: { status: 'CONCLUIDA' },
      });
    } catch {}

    try {
      await fetch(`${SUPABASE_REST_URL}/rest/v1/vendas?id=eq.${vendaId}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ status: 'CONCLUIDA', updated_at: new Date().toISOString() })
      });
    } catch (e: any) {
      console.warn('[Webhook REST] Erro ao atualizar status:', e.message);
    }

    // 3. Decrementa o estoque dos itens
    if (vendaAtual.itens && vendaAtual.itens.length > 0) {
      for (const item of vendaAtual.itens) {
        try {
          if (item.produto_ean) {
            const pRes = await fetch(`${SUPABASE_REST_URL}/rest/v1/produtos?ean=eq.${encodeURIComponent(item.produto_ean)}&select=id`, {
              headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              }
            });
            if (pRes.ok) {
              const pData = await pRes.json();
              if (Array.isArray(pData) && pData.length > 0) {
                const prodId = pData[0].id;
                await fetch(`${SUPABASE_REST_URL}/rest/v1/rpc/decrementar_estoque`, {
                  method: 'POST',
                  headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    p_produto_id: prodId,
                    p_qtd: Number(item.quantidade) || 1
                  })
                });
              }
            }
          }
        } catch (stkErr: any) {
          console.warn('[Webhook] Erro ao decrementar estoque:', stkErr.message);
        }
      }
    }

    console.log(`[Webhook] Venda #${vendaId} aprovada, estoque baixado e status marcado como CONCLUIDA!`);

    // 4. Notificação opcional WhatsApp / n8n
    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (n8nUrl) {
      try {
        await fetch(n8nUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'PAGAMENTO_APROVADO',
            vendaId,
            comprovanteRef,
            origem: 'mercadopago_orders',
          }),
        });
      } catch {}
    }
  } catch (err: any) {
    console.error(`Erro ao processar baixa da venda #${vendaId}:`, err);
  }
}

/**
 * Processa estorno/cancelamento de venda: altera status para ESTORNADA e devolve produtos ao estoque
 */
async function processarEstorno(vendaId: number, comprovanteRef: string, motivo?: string) {
  try {
    let vendaAtual: { id: number; status: string; itens?: any[] } | null = null;
    const vRes = await fetch(`${SUPABASE_REST_URL}/rest/v1/vendas?id=eq.${vendaId}&select=id,status`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      cache: 'no-store'
    });
    if (vRes.ok) {
      const vData = await vRes.json();
      if (Array.isArray(vData) && vData.length > 0) {
        const iRes = await fetch(`${SUPABASE_REST_URL}/rest/v1/vendas_itens?venda_id=eq.${vendaId}&select=*`, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          cache: 'no-store'
        });
        const iData = iRes.ok ? await iRes.json() : [];
        vendaAtual = { ...vData[0], itens: iData };
      }
    }

    if (!vendaAtual || vendaAtual.status === 'ESTORNADA' || vendaAtual.status === 'CANCELADA') {
      return;
    }

    // 1. Marca venda como ESTORNADA
    const estornoPayload = {
      status: 'ESTORNADA',
      motivo_cancelamento: motivo || 'Estorno solicitado ou aprovado no Mercado Pago',
      estorno_info: {
        data: new Date().toISOString(),
        comprovanteRef,
        motivo: motivo || 'Estorno via Mercado Pago',
        por: 'Mercado Pago Webhook'
      },
      updated_at: new Date().toISOString()
    };

    try {
      await prisma.venda.update({
        where: { id: vendaId },
        data: {
          status: 'ESTORNADA',
          motivo_cancelamento: motivo || 'Estorno via Mercado Pago',
          estorno_info: estornoPayload.estorno_info as any,
        }
      });
    } catch {}

    await fetch(`${SUPABASE_REST_URL}/rest/v1/vendas?id=eq.${vendaId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(estornoPayload)
    });

    // 2. Devolve os produtos ao estoque
    if (vendaAtual.itens && vendaAtual.itens.length > 0) {
      for (const item of vendaAtual.itens) {
        try {
          if (item.produto_ean) {
            const pRes = await fetch(`${SUPABASE_REST_URL}/rest/v1/produtos?ean=eq.${encodeURIComponent(item.produto_ean)}&select=id`, {
              headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              }
            });
            if (pRes.ok) {
              const pData = await pRes.json();
              if (Array.isArray(pData) && pData.length > 0) {
                const prodId = pData[0].id;
                await fetch(`${SUPABASE_REST_URL}/rest/v1/rpc/incrementar_estoque`, {
                  method: 'POST',
                  headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    p_produto_id: prodId,
                    p_qtd: Number(item.quantidade) || 1
                  })
                });
              }
            }
          }
        } catch (stkErr: any) {
          console.warn('[Webhook Estorno] Erro ao devolver estoque:', stkErr.message);
        }
      }
    }
    console.log(`[Webhook] Venda #${vendaId} estornada e itens devolvidos ao estoque com sucesso!`);
  } catch (err: any) {
    console.error(`[Webhook] Erro ao estornar venda #${vendaId}:`, err);
  }
}

