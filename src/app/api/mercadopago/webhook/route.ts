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

    // Validação de assinatura se o segredo estiver configurado
    const webhookSecret = process.env.MP_WEBHOOK_SECRET;
    if (webhookSecret && !validateWebhookSignature(xSignature, xRequestId, dataId, webhookSecret)) {
      console.warn('Webhook rejeitado: assinatura inválida.');
      return NextResponse.json({ success: false, message: 'Assinatura inválida' }, { status: 401 });
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

      if (isApproved && !isNaN(vendaId)) {
        await processarPagamentoAprovado(vendaId, orderData.id);
      }

      return NextResponse.json({ success: true, orderId: dataId });
    }

    // 2. Compatibilidade com notificações legadas de payment
    if (topic === 'payment' || action?.startsWith('payment.')) {
      if (!dataId) {
        return NextResponse.json({ success: false, message: 'ID do pagamento ausente' }, { status: 400 });
      }

      // Consulta pagamento
      const accessToken = process.env.MP_ACCESS_TOKEN;
      if (accessToken) {
        const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(dataId)}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (payRes.ok) {
          const payData = await payRes.json();
          if (payData.status === 'approved' && payData.external_reference) {
            const vendaId = parseInt(payData.external_reference, 10);
            if (!isNaN(vendaId)) {
              await processarPagamentoAprovado(vendaId, String(payData.id));
            }
          }
        }
      }

      return NextResponse.json({ success: true, paymentId: dataId });
    }

    return NextResponse.json({ success: true, message: 'Evento recebido' });
  } catch (error: any) {
    console.error('Erro no processamento do webhook Mercado Pago:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

/**
 * Atualiza status no banco, decrementa estoque e avisa o PDV
 */
async function processarPagamentoAprovado(vendaId: number, comprovanteRef: string) {
  try {
    // 1. Atualiza venda para CONCLUIDA
    try {
      await prisma.venda.update({
        where: { id: vendaId },
        data: { status: 'CONCLUIDA' },
      });
    } catch (e: any) {
      console.warn(`Aviso ao atualizar venda #${vendaId} no Prisma:`, e.message);
    }

    // 2. Atualiza no Supabase REST e decrementa estoque
    const sbKey = supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && sbKey) {
      const supabase = createClient(supabaseUrl, sbKey);

      try {
        await supabase
          .from('vendas')
          .update({ status: 'CONCLUIDA' })
          .eq('id', vendaId);
      } catch (e: any) {
        console.warn(`Aviso ao atualizar venda #${vendaId} no Supabase:`, e.message);
      }

      try {
        const venda = await prisma.venda.findUnique({
          where: { id: vendaId },
          include: { itens: true },
        });

        if (venda?.itens) {
          for (const item of venda.itens) {
            const produto = await prisma.produto.findUnique({ where: { ean: item.produto_ean } });
            if (produto) {
              await supabase.rpc('decrementar_estoque', {
                p_produto_id: produto.id,
                p_qtd: item.quantidade,
              });
            }
          }
        }
      } catch (e: any) {
        console.warn('Aviso no decremento de estoque:', e.message);
      }

      // 3. Notificação em tempo real para o PDV
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

    // 4. Webhook opcional n8n / WhatsApp
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
