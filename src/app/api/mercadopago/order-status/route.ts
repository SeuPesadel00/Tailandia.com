import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { createClient } from '@supabase/supabase-js';
import { getMercadoPagoOrder } from '../../../../services/mercadopagoOrders';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vendaIdParam = searchParams.get('vendaId');
    const orderId = searchParams.get('orderId');

    if (!vendaIdParam && !orderId) {
      return NextResponse.json({ success: false, message: 'Identificador do pedido ausente.' }, { status: 400 });
    }

    const vendaId = vendaIdParam ? parseInt(vendaIdParam, 10) : null;

    // 1. Consulta o status da venda no banco de dados (Prisma e Supabase)
    let dbStatus = 'PENDENTE';
    let dbTotal = 0;

    if (vendaId && !isNaN(vendaId)) {
      try {
        const venda = await prisma.venda.findUnique({
          where: { id: vendaId },
          select: { status: true, total: true },
        });
        if (venda) {
          dbStatus = (venda.status || 'PENDENTE').toUpperCase();
          dbTotal = Number(venda.total || 0);
        }
      } catch (err: any) {
        // Fallback Supabase REST
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (supabaseUrl && supabaseKey) {
          try {
            const supabase = createClient(supabaseUrl, supabaseKey);
            const { data } = await supabase
              .from('vendas')
              .select('status, total')
              .eq('id', vendaId)
              .single();
            if (data) {
              dbStatus = (data.status || 'PENDENTE').toUpperCase();
              dbTotal = Number(data.total || 0);
            }
          } catch {}
        }
      }
    }

    // Se já foi marcada como CONCLUIDA no banco, retorna imediatamente
    if (dbStatus === 'CONCLUIDA') {
      return NextResponse.json({
        success: true,
        vendaId,
        status: 'CONCLUIDA',
        isPaid: true,
        total: dbTotal,
      });
    }

    // 2. Se ainda estiver pendente e temos o orderId da Orders API, consulta o Mercado Pago
    if (orderId) {
      try {
        const mpOrder = await getMercadoPagoOrder(orderId);
        const payment = mpOrder.transactions?.payments?.[0];

        const isApproved =
          mpOrder.status === 'processed' ||
          payment?.status === 'processed' ||
          payment?.status === 'approved' ||
          payment?.status_detail === 'accredited';

        const isRejected =
          mpOrder.status === 'cancelled' ||
          payment?.status === 'rejected' ||
          payment?.status === 'cancelled';

        if (isApproved) {
          // Atualiza atomicamente no banco para CONCLUIDA
          if (vendaId) {
            try {
              await prisma.venda.update({
                where: { id: vendaId },
                data: { status: 'CONCLUIDA' },
              });
            } catch {
              const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
              const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
              if (supabaseUrl && supabaseKey) {
                const supabase = createClient(supabaseUrl, supabaseKey);
                await supabase.from('vendas').update({ status: 'CONCLUIDA' }).eq('id', vendaId);
              }
            }
          }

          return NextResponse.json({
            success: true,
            vendaId,
            status: 'CONCLUIDA',
            isPaid: true,
            orderId,
            paidAmount: mpOrder.total_amount,
          });
        }

        if (isRejected) {
          return NextResponse.json({
            success: true,
            vendaId,
            status: 'REJEITADA',
            isPaid: false,
            orderId,
            statusDetail: payment?.status_detail || 'Pagamento não autorizado ou expirado.',
          });
        }

        return NextResponse.json({
          success: true,
          vendaId,
          status: 'PENDENTE',
          isPaid: false,
          orderId,
          statusDetail: payment?.status_detail || 'waiting_transfer',
        });
      } catch (mpErr: any) {
        console.warn('[OrderStatus] Aviso ao consultar Mercado Pago:', mpErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      vendaId,
      status: dbStatus,
      isPaid: dbStatus === 'CONCLUIDA',
    });
  } catch (error: any) {
    console.error('[OrderStatus] Erro interno:', error);
    return NextResponse.json({ success: false, message: 'Erro ao consultar status.' }, { status: 500 });
  }
}
