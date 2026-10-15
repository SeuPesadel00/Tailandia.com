import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const MP_API_BASE = 'https://api.mercadopago.com';
const MP_ACCESS_TOKEN =
  process.env.MP_ACCESS_TOKEN ||
  'APP_USR-4682271217183527-101408-e3bd8bda86656be83273177f61419eae-3764831852';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const totalAmount = Number(body.total_amount || body.transactionAmount || body.total || 0).toFixed(2);
    if (Number(totalAmount) <= 0) {
      return NextResponse.json({ success: false, error: 'Valor da transação inválido.' }, { status: 400 });
    }

    let cleanDoc = String(body.identificationNumber || body.docNumber || '').replace(/\D/g, '');
    if (cleanDoc.length !== 11) {
      cleanDoc = '19119119100'; // Homologação Sandbox BACEN/PIX padrão
    }

    const docType = String(body.identificationType || body.docType || 'CPF').toUpperCase();
    const email = String(body.email || 'pdv@tailandiadistribuidora.com.br').trim();
    const firstName = String(body.payerFirstName || body.firstName || 'Cliente').trim();
    const lastName = String(body.payerLastName || body.lastName || 'Balcao').trim();
    const extRef = String(body.external_reference || `PDV_${Date.now()}`);

    const idempotencyKey = crypto.randomUUID();

    const orderPayload = {
      type: 'online',
      processing_mode: 'automatic',
      total_amount: totalAmount,
      external_reference: extRef,
      notification_url: 'https://tailandia-com-6f82.vercel.app/api/mercadopago/webhook',
      payer: {
        email,
        first_name: firstName,
        last_name: lastName,
        identification: {
          type: docType,
          number: cleanDoc,
        },
      },
      transactions: {
        payments: [
          {
            amount: totalAmount,
            payment_method: {
              id: 'pix',
              type: 'bank_transfer',
            },
          },
        ],
      },
    };

    const res = await fetch(`${MP_API_BASE}/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(orderPayload),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('[API Order] Erro Mercado Pago:', data);
      return NextResponse.json(
        {
          success: false,
          error: data.message || 'Falha ao gerar PIX no Mercado Pago',
          details: data,
        },
        { status: res.status }
      );
    }

    const payment = data.transactions?.payments?.[0];
    const pixMethod = payment?.payment_method;

    return NextResponse.json({
      success: true,
      order_id: data.id,
      status: data.status,
      status_detail: data.status_detail,
      amount: data.total_amount,
      external_reference: data.external_reference,
      qr_code: pixMethod?.qr_code || '',
      qr_code_base64: pixMethod?.qr_code_base64 || '',
      ticket_url: pixMethod?.ticket_url || '',
    });
  } catch (err: any) {
    console.error('[API Order] Exceção:', err);
    return NextResponse.json(
      { success: false, error: 'Erro de conexão com o Mercado Pago: ' + err.message },
      { status: 500 }
    );
  }
}
