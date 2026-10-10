import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { PrismaClient } from '@prisma/client';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });
const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { total, items, email, firstName, lastName, docType, docNumber } = body;

    // 1. Cria a venda como pendente no banco
    const venda = await prisma.venda.create({
      data: {
        total: total,
        metodo_pagamento: 'PIX',
        status: 'PENDENTE',
        cpf_cnpj_cliente: docNumber,
        itens: {
          create: items.map((item: any) => ({
            produto_ean: item.ean,
            quantidade: item.quantity,
            preco_unitario: item.unit_price,
            produto_nome: item.title,
          }))
        }
      }
    });

    // 2. Chama a API do Mercado Pago para gerar o PIX
    const payment = new Payment(client);
    const mpResponse = await payment.create({
      body: {
        transaction_amount: total,
        description: 'Pedido Delivery Tailandia',
        payment_method_id: 'pix',
        payer: {
          email,
          first_name: firstName,
          last_name: lastName,
          identification: {
            type: docType,
            number: docNumber
          }
        },
        external_reference: venda.id.toString(), // Liga o MP ao nosso ID interno
      }
    });

    return NextResponse.json({
      success: true,
      vendaId: venda.id,
      qrCodeBase64: mpResponse.point_of_interaction?.transaction_data?.qr_code_base64,
      qrCodeCopiaECola: mpResponse.point_of_interaction?.transaction_data?.qr_code,
      paymentId: mpResponse.id,
    });

  } catch (error: any) {
    console.error('Erro ao gerar pagamento:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
