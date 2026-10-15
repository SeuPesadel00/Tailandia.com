import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getMercadoPagoOrder } from '../../../../services/mercadopagoOrders';

export const dynamic = 'force-dynamic';

const SUPABASE_REST_URL = (
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rgggdawwkmncpfetuhij.supabase.co'
).replace(/rgggdawwkmcnpfetuhij/g, 'rgggdawwkmncpfetuhij');

const SUPABASE_ANON_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnZ2dkYXd3a21uY3BmZXR1aGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NTUyNjgsImV4cCI6MjEwNjQzMTI2OH0.1uXP6pHtcdfKlmuB1rIcnhVQf9uCT3Yb9iyIuo9hZNc';

async function getVendaFromSupabaseRest(vendaId: number) {
  try {
    const res = await fetch(`${SUPABASE_REST_URL}/rest/v1/vendas?id=eq.${vendaId}&select=status,total,mp_order_id`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch (err: any) {
    console.warn('[OrderStatus REST] Erro ao consultar venda:', err.message);
    return null;
  }
}

async function updateVendaStatusInSupabase(vendaId: number, novoStatus: string) {
  try {
    await fetch(`${SUPABASE_REST_URL}/rest/v1/vendas?id=eq.${vendaId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ status: novoStatus, updated_at: new Date().toISOString() })
    });
  } catch (err: any) {
    console.warn('[OrderStatus REST] Erro ao atualizar status:', err.message);
  }
}

async function decrementarEstoqueVenda(vendaId: number) {
  try {
    const iRes = await fetch(`${SUPABASE_REST_URL}/rest/v1/vendas_itens?venda_id=eq.${vendaId}&select=*`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      cache: 'no-store'
    });
    if (!iRes.ok) return;
    const itens = await iRes.json();
    if (!Array.isArray(itens)) return;

    for (const item of itens) {
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
    }
  } catch (e: any) {
    console.warn('[OrderStatus] Erro ao decrementar estoque:', e.message);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vendaIdParam = searchParams.get('vendaId');
    let orderId = searchParams.get('orderId');

    if (!vendaIdParam && !orderId) {
      return NextResponse.json({ success: false, message: 'Identificador do pedido ausente.' }, { status: 400 });
    }

    const vendaId = vendaIdParam ? parseInt(vendaIdParam, 10) : null;

    // 1. Consulta o status da venda no banco de dados (Prisma com fallback Supabase REST)
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
        // Fallback Supabase REST garantido
        const restVenda = await getVendaFromSupabaseRest(vendaId);
        if (restVenda) {
          dbStatus = (restVenda.status || 'PENDENTE').toUpperCase();
          dbTotal = Number(restVenda.total || 0);
          if (!orderId && restVenda.mp_order_id) {
            orderId = restVenda.mp_order_id;
          }
        }
      }
    }

    // Se já foi marcada como CONCLUIDA no banco, retorna imediatamente aprovação
    if (dbStatus === 'CONCLUIDA' || dbStatus === 'PAGO' || dbStatus === 'APROVADO') {
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
          mpOrder.status === 'approved' ||
          payment?.status === 'processed' ||
          payment?.status === 'approved' ||
          payment?.status_detail === 'accredited';

        const isRejected =
          mpOrder.status === 'cancelled' ||
          payment?.status === 'rejected' ||
          payment?.status === 'cancelled';

        if (isApproved) {
          // Atualiza atomicamente no banco para CONCLUIDA se ainda pendente
          if (vendaId && dbStatus !== 'CONCLUIDA') {
            try {
              await prisma.venda.update({
                where: { id: vendaId },
                data: { status: 'CONCLUIDA' },
              });
            } catch {}
            await updateVendaStatusInSupabase(vendaId, 'CONCLUIDA');
            await decrementarEstoqueVenda(vendaId);
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
      isPaid: dbStatus === 'CONCLUIDA' || dbStatus === 'PAGO' || dbStatus === 'APROVADO',
      total: dbTotal,
    });
  } catch (error: any) {
    console.error('[OrderStatus] Erro interno:', error);
    return NextResponse.json({ success: false, message: 'Erro ao consultar status.' }, { status: 500 });
  }
}
