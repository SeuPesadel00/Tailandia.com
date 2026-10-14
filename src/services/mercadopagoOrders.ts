import crypto from 'crypto';

const MP_API_BASE = 'https://api.mercadopago.com';

function getAccessToken(): string {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    throw new Error('MP_ACCESS_TOKEN não configurado no ambiente.');
  }
  return token;
}

export interface CreateOrderParams {
  vendaId: number;
  total: number;
  email: string;
  firstName?: string;
  lastName?: string;
  docType?: string;
  docNumber: string;
  paymentMethod: 'pix' | 'credit_card';
  cardToken?: string;
  cardPaymentMethodId?: string;
  installments?: number;
}

export interface OrderResponse {
  id: string;
  status: string;
  status_detail?: string;
  external_reference?: string;
  total_amount: string;
  transactions?: {
    payments?: Array<{
      id: string;
      status: string;
      status_detail?: string;
      amount: string;
      payment_method?: {
        id: string;
        type: string;
        ticket_url?: string;
        qr_code?: string;
        qr_code_base64?: string;
      };
    }>;
  };
}

/**
 * Cria um pedido utilizando a API oficial de Orders do Mercado Pago
 * (Checkout Transparente via Orders - /v1/orders)
 */
export async function createMercadoPagoOrder(params: CreateOrderParams): Promise<OrderResponse> {
  const accessToken = getAccessToken();
  const idempotencyKey = crypto.randomUUID();

  const formattedAmount = Number(params.total).toFixed(2);
  const cleanDoc = (params.docNumber || '').replace(/\D/g, '');

  let paymentPayload: any;

  if (params.paymentMethod === 'pix') {
    paymentPayload = {
      amount: formattedAmount,
      payment_method: {
        id: 'pix',
        type: 'bank_transfer',
      },
    };
  } else {
    if (!params.cardToken) {
      throw new Error('Token do cartão é obrigatório para pagamentos com cartão.');
    }
    paymentPayload = {
      amount: formattedAmount,
      payment_method: {
        id: params.cardPaymentMethodId || 'credit_card',
        type: 'credit_card',
        token: params.cardToken,
        installments: params.installments || 1,
      },
    };
  }

  const orderBody = {
    type: 'online',
    processing_mode: 'automatic',
    total_amount: formattedAmount,
    external_reference: String(params.vendaId),
    payer: {
      email: params.email,
      first_name: params.firstName,
      last_name: params.lastName,
      identification: {
        type: params.docType || 'CPF',
        number: cleanDoc,
      },
    },
    transactions: {
      payments: [paymentPayload],
    },
  };

  const response = await fetch(`${MP_API_BASE}/v1/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'X-Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(orderBody),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorDetail = data.message || data.error || JSON.stringify(data);
    throw new Error(`Falha no Mercado Pago Orders API (${response.status}): ${errorDetail}`);
  }

  return data as OrderResponse;
}

/**
 * Consulta o status e dados de um pedido na Orders API
 */
export async function getMercadoPagoOrder(orderId: string): Promise<OrderResponse> {
  const accessToken = getAccessToken();

  const response = await fetch(`${MP_API_BASE}/v1/orders/${encodeURIComponent(orderId)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Erro ao consultar pedido ${orderId}: ${err}`);
  }

  return response.json();
}

/**
 * Valida a assinatura HMAC de webhooks do Mercado Pago (x-signature)
 */
export function validateWebhookSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string | null,
  secret: string
): boolean {
  if (!xSignature || !secret) return true; // Se não tiver secret configurado no .env, não bloqueia em dev

  try {
    let ts: string | undefined;
    let v1Hash: string | undefined;

    for (const part of xSignature.split(',')) {
      const [key, val] = part.split('=').map((s) => s.trim());
      if (key === 'ts') ts = val;
      if (key === 'v1') v1Hash = val;
    }

    if (!ts || !v1Hash) return false;

    const parts: string[] = [];
    if (dataId) parts.push(`id:${dataId.toLowerCase()}`);
    if (xRequestId) parts.push(`request-id:${xRequestId}`);
    parts.push(`ts:${ts}`);

    const manifest = parts.join(';') + ';';
    const computed = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(v1Hash));
  } catch {
    return false;
  }
}
