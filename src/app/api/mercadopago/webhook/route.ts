import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });
const prisma = new PrismaClient();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const id = url.searchParams.get('data.id');

    if (action === 'payment.updated' || action === 'payment.created') {
      if (!id) return NextResponse.json({ success: false, message: 'ID ausente' }, { status: 400 });

      // Busca o pagamento no Mercado Pago
      const paymentInfo = new Payment(client);
      const paymentData = await paymentInfo.get({ id });

      const externalReference = paymentData.external_reference;
      const status = paymentData.status;

      if (!externalReference) {
        return NextResponse.json({ success: false, message: 'Falta external_reference' }, { status: 400 });
      }

      const vendaId = parseInt(externalReference, 10);

      if (status === 'approved') {
        // 1. Atualiza o status da venda para CONCLUIDA e PAID
        await prisma.venda.update({
          where: { id: vendaId },
          data: { status: 'CONCLUIDA' }
        });

        // 2. Decrementa o estoque usando Supabase RPC (para garantir ACID)
        const venda = await prisma.venda.findUnique({
          where: { id: vendaId },
          include: { itens: true }
        });

        if (venda) {
          for (const item of venda.itens) {
            // Chamada RPC configurada no Supabase
            // Como temos o EAN no item, precisamos buscar o ID do produto ou alterar a RPC para usar EAN
            // Vou usar o Prisma pra pegar o ID do produto e depois chamar a RPC
            const produto = await prisma.produto.findUnique({ where: { ean: item.produto_ean } });
            
            if (produto) {
              const { data, error } = await supabase.rpc('decrementar_estoque', {
                p_produto_id: produto.id,
                p_qtd: item.quantidade
              });
              
              if (error || !data) {
                console.error(`Erro ao decrementar estoque do produto ${produto.id}`, error);
                // Tratar falta de estoque pós-pagamento
              }
            }
          }
        }

        // 3. Dispara Realtime para o PDV (usando Supabase Broadcast)
        await supabase.channel('pdv-notifications').send({
          type: 'broadcast',
          event: 'nova_venda_online',
          payload: { vendaId, mensagem: `Nova Venda Online #${vendaId} paga via PIX!` }
        });

        // 4. (Opcional) Webhook para o n8n disparar WhatsApp
        if (process.env.N8N_WEBHOOK_URL) {
          await fetch(process.env.N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: 'PAGAMENTO_CONFIRMADO', vendaId, status })
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro no webhook:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
