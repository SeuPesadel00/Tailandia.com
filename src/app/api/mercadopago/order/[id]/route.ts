import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const MP_API_BASE = 'https://api.mercadopago.com';
const MP_ACCESS_TOKEN =
  process.env.MP_ACCESS_TOKEN ||
  'APP_USR-4682271217183527-101408-e3bd8bda86656be83273177f61419eae-3764831852';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    if (!orderId) {
      return NextResponse.json({ success: false, error: 'ID da ordem ausente' }, { status: 400 });
    }

    const res = await fetch(`${MP_API_BASE}/v1/orders/${encodeURIComponent(orderId)}`, {
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: 'Falha ao consultar pedido no Mercado Pago' },
        { status: res.status }
      );
    }

    const data = await res.json();
    const payment = data.transactions?.payments?.[0];
    const isApproved =
      data.status === 'processed' ||
      data.status === 'approved' ||
      payment?.status === 'processed' ||
      payment?.status === 'approved' ||
      payment?.status_detail === 'accredited';

    return NextResponse.json({
      success: true,
      order_id: data.id,
      status: data.status,
      status_detail: data.status_detail,
      is_approved: isApproved,
      amount: data.total_amount,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Erro ao consultar ordem: ' + err.message },
      { status: 500 }
    );
  }
}
