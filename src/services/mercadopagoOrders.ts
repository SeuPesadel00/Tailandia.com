import crypto from 'crypto';

const MP_API_BASE = 'https://api.mercadopago.com';

function getAccessToken(): string {
  return (
    process.env.MP_ACCESS_TOKEN ||
    'APP_USR-4682271217183527-101408-e3bd8bda86656be83273177f61419eae-3764831852'
  );
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
  idempotencyKey?: string;
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

export function validarCPF(cpf: string): boolean {
  const clean = (cpf || '').replace(/\D/g, '');
  if (clean.length !== 11) return false;
  // Bloqueia dígitos iguais (ex: 111.111.111-11, 000.000.000-00)
  if (/^(\d)\1{10}$/.test(clean)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(clean.charAt(i), 10) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(clean.charAt(9), 10)) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(clean.charAt(i), 10) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(clean.charAt(10), 10)) return false;

  return true;
}

/**
 * Cria um pedido utilizando a API oficial de Orders do Mercado Pago
 * (Checkout Transparente via Orders - /v1/orders)
 */
export async function createMercadoPagoOrder(params: CreateOrderParams): Promise<OrderResponse> {
  const accessToken = getAccessToken();
  const formattedAmount = Number(params.total).toFixed(2);
  const idempotencyKey = params.idempotencyKey || `mp-order-${params.vendaId}-${params.paymentMethod}-${formattedAmount}`;
  const cleanDoc = (params.docNumber || '').replace(/\D/g, '');

  // Validação de CPF para evitar rejection 402 processing_error
  if (!validarCPF(cleanDoc)) {
    throw new Error('O CPF informado é inválido. Por favor, digite um CPF válido com dígitos verificadores corretos (no modo Sandbox use 191.191.191-00).');
  }

  // Sanitização de nome e sobrenome (exigidos pelo Mercado Pago)
  let firstName = (params.firstName || '').trim();
  let lastName = (params.lastName || '').trim();
  if (firstName && !lastName) {
    const parts = firstName.split(/\s+/);
    if (parts.length > 1) {
      firstName = parts[0];
      lastName = parts.slice(1).join(' ');
    } else {
      lastName = 'Cliente';
    }
  }
  if (!firstName) firstName = 'Cliente';
  if (!lastName) lastName = 'Tailândia';

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
      first_name: firstName,
      last_name: lastName,
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
    const rawDataStr = JSON.stringify(data);
    console.error('[MercadoPago Orders Error]', {
      status: response.status,
      vendaId: params.vendaId,
      error: data,
    });

    let friendlyMessage = 'Erro ao processar transação no Mercado Pago.';
    if (response.status === 402 || rawDataStr.includes('processing_error')) {
      friendlyMessage = 'Falha no processamento do Pix pelo Mercado Pago. O documento (CPF) ou dados do pagador não foram aceitos (em ambiente de teste Sandbox, utilize o CPF 191.191.191-00).';
    } else if (response.status === 400 && rawDataStr.includes('identification')) {
      friendlyMessage = 'O CPF informado é inválido. Por favor, verifique e tente novamente.';
    } else if (data.message && typeof data.message === 'string') {
      friendlyMessage = data.message;
    }

    const err = new Error(friendlyMessage);
    (err as any).status = response.status;
    (err as any).details = data;
    throw err;
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
  secret?: string | null
): boolean {
  const effectiveSecret =
    secret ||
    process.env.MP_WEBHOOK_SECRET ||
    '3e78ad080871ceb3504a7bee99d4d76b3157bb38049ebd7197408422dbfdb6a9';

  if (!effectiveSecret) {
    console.error('[Webhook Security] MP_WEBHOOK_SECRET não configurado. Rejeitando requisição por segurança.');
    return false;
  }
  if (!xSignature) {
    console.warn('[Webhook Security] Header x-signature ausente. Requisição rejeitada.');
    return false;
  }

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
    const computed = crypto.createHmac('sha256', effectiveSecret).update(manifest).digest('hex');

    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(v1Hash));
  } catch {
    return false;
  }
}
