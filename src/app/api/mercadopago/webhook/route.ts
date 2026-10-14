import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { createClient } from '@supabase/supabase-js';
import { getMercadoPagoOrder, validateWebhookSignature } from '../../../../services/mercadopagoOrders';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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
    const webhookSecret = process.env.MP_WEBHOOK_SECRET;
    if (!validateWebhookSignature(xSignature, xRequestId, dataId, webhookSecret)) {
      console.warn('[Webhook Security] Webhook rejeitado: assinatura inválida ou segredo ausente.');
      return NextResponse.json({ success: false, message: 'Assinatura inválida ou segredo não configurado' }, { status: 401 });
    }

    // 1. Processamento de notificações do tópico ORDER (Orders API)
    if (topic === 'order' || action?.startsWith('order.')) {
      if (!dataId) {
        return NextResponse.json({ success: false, message: 'ID da ordem ausente' }, { status: 400 });
      }

      // Consulta o pedido atualizado diretamente na API de Orders
      const orderData = await getMercadoPagoOrder(dataId);
      const externalReference = orderData.external_reference;

      if (!externalReference) {
        return NextResponse.json({ success: true, message: 'Ordem sem external_reference, ignorada.' });
      }

      const vendaId = parseInt(externalReference, 10);
      const isApproved =
        orderData.status === 'processed' ||
        orderData.transactions?.payments?.some(
          (p) => p.status === 'processed' || p.status === 'approved' || p.status_detail === 'accredited'
        );

      const paidAmount = Number(orderData.total_amount || 0);

      if (isApproved && !isNaN(vendaId)) {
        await processarPagamentoAprovado(vendaId, orderData.id, paidAmount);
      }

      return NextResponse.json({ success: true, orderId: dataId });
    }

    // 2. Compatibilidade com notificações legadas de payment
    if (topic === 'payment' || action?.startsWith('payment.')) {
      if (!dataId) {
        return NextResponse.json({ success: false, message: 'ID do pagamento ausente' }, { status: 400 });
      }

      const accessToken = process.env.MP_ACCESS_TOKEN;
      if (accessToken) {
        const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(dataId)}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (payRes.ok) {
          const payData = await payRes.json();
          if (payData.status === 'approved' && payData.external_reference) {
            const vendaId = parseInt(payData.external_reference, 10);
            const paidAmount = Number(payData.transaction_amount || 0);
            if (!isNaN(vendaId)) {
              await processarPagamentoAprovado(vendaId, String(payData.id), paidAmount);
            }
          }
        }
      }

      return NextResponse.json({ success: true, paymentId: dataId });
    }

    return NextResponse.json({ success: true, message: 'Evento recebido' });
  } catch (error: any) {
    console.error('Erro no processamento do webhook Mercado Pago:', error);
    return NextResponse.json({ success: false, message: 'Erro interno ao processar webhook' }, { status: 500 });
  }
}

/**
 * Atualiza status no banco com idempotência estrita, valida valor pago e decrementa estoque uma única vez
 */
async function processarPagamentoAprovado(vendaId: number, comprovanteRef: string, paidAmount?: number) {
  try {
    const sbKey = supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = (supabaseUrl && sbKey) ? createClient(supabaseUrl, sbKey) : null;

    // 1. Checagem de Idempotência: busca a venda atual no banco
    let vendaAtual: { id: number; status: string; total: any; itens?: any[] } | null = null;

    try {
      vendaAtual = await prisma.venda.findUnique({
        where: { id: vendaId },
        include: { itens: true },
      }) as any;
    } catch {
      if (supabase) {
        const { data: vData } = await supabase
          .from('vendas')
          .select('id, status, total')
          .eq('id', vendaId)
          .single();
        if (vData) {
          const { data: iData } = await supabase
            .from('vendas_itens')
            .select('*')
            .eq('venda_id', vendaId);
          vendaAtual = { ...vData, itens: iData || [] };
        }
      }
    }

    if (!vendaAtual) {
      console.warn(`[Webhook Idempotency] Venda #${vendaId} não encontrada no banco. Abortando.`);
      return;
    }

    // Se já foi concluída anteriormente, ignora para não duplicar baixa de estoque
    if (vendaAtual.status === 'CONCLUIDA') {
      console.log(`[Webhook Idempotency] Venda #${vendaId} já está CONCLUIDA. Notificação ignorada com segurança.`);
      return;
    }

    // Validação de Fraude Financeira: confere se o valor pago bate com o total da venda gravado
    const totalEsperado = Number(vendaAtual.total || 0);
    if (paidAmount !== undefined && paidAmount > 0) {
      if (paidAmount < totalEsperado - 0.05) {
        console.error(`[Webhook Security Alert] Fraude ou divergência de valor na Venda #${vendaId}! Valor pago: R$ ${paidAmount}, total esperado: R$ ${totalEsperado}.`);
        return;
      }
    }

    // 2. Atualiza status para CONCLUIDA
    try {
      await prisma.venda.update({
        where: { id: vendaId },
        data: { status: 'CONCLUIDA' },
      });
    } catch (e: any) {
      console.warn(`Aviso ao atualizar venda #${vendaId} no Prisma:`, e.message);
    }

    if (supabase) {
      try {
        await supabase
          .from('vendas')
          .update({ status: 'CONCLUIDA' })
          .eq('id', vendaId);
      } catch (e: any) {
        console.warn(`Aviso ao atualizar venda #${vendaId} no Supabase:`, e.message);
      }

      // 3. Decrementa estoque dos itens
      try {
        const itens = vendaAtual.itens || [];
        for (const item of itens) {
          if (item.produto_ean) {
            let prodId: number | null = null;
            try {
              const p = await prisma.produto.findUnique({ where: { ean: item.produto_ean }, select: { id: true } });
              prodId = p?.id || null;
            } catch {}

            if (!prodId) {
              const { data: pData } = await supabase
                .from('produtos')
                .select('id')
                .eq('ean', item.produto_ean)
                .single();
              prodId = pData?.id || null;
            }

            if (prodId) {
              await supabase.rpc('decrementar_estoque', {
                p_produto_id: prodId,
                p_qtd: item.quantidade || 1,
              });
            }
          }
        }
      } catch (e: any) {
        console.warn('Aviso no decremento de estoque:', e.message);
      }

      // 4. Notificação em tempo real para o PDV físico
      try {
        await supabase.channel('pdv-notifications').send({
          type: 'broadcast',
          event: 'nova_venda_online',
          payload: {
            vendaId,
            comprovanteRef,
            mensagem: `⚡ Venda Online #${vendaId} confirmada via Mercado Pago!`,
          },
        });
      } catch (e: any) {
        console.warn('Aviso no envio broadcast PDV:', e.message);
      }
    }

    // 5. Notificação WhatsApp / n8n
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
