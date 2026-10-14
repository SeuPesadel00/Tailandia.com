import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { createMercadoPagoOrder } from '../../../../services/mercadopagoOrders';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      total,
      items,
      email,
      firstName,
      lastName,
      docType = 'CPF',
      docNumber,
      paymentMethod = 'pix', // 'pix' | 'credit_card'
      cardToken,
      cardPaymentMethodId,
      installments = 1,
    } = body;

    // 1. Validação de dados obrigatórios
    if (!total || Number(total) <= 0) {
      return NextResponse.json({ success: false, message: 'Valor total inválido.' }, { status: 400 });
    }
    if (!email || !docNumber) {
      return NextResponse.json({ success: false, message: 'E-mail e documento (CPF) são obrigatórios.' }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Carrinho não pode estar vazio.' }, { status: 400 });
    }

    const cleanDoc = String(docNumber).replace(/\D/g, '');
    const cleanTotal = Number(total);

    // 2. Validação atômica de estoque contra o banco de dados (Prevenção de Overselling PDV vs Web)
    try {
      for (const item of items) {
        if (item.ean && item.ean !== 'EAN-GERAL') {
          const dbProd = await prisma.produto.findUnique({
            where: { ean: String(item.ean) },
            select: { nome: true, estoque_atual: true }
          });
          if (dbProd) {
            const requestedQty = Math.max(1, parseInt(item.quantity, 10) || 1);
            if ((dbProd.estoque_atual ?? 0) < requestedQty) {
              return NextResponse.json({
                success: false,
                code: 'OUT_OF_STOCK',
                message: `O produto "${dbProd.nome}" acabou de esgotar no balcão físico do PDV (restam apenas ${dbProd.estoque_atual ?? 0} un.). Por favor, atualize seu carrinho.`
              }, { status: 409 });
            }
          }
        }
      }
    } catch (stockCheckErr: any) {
      console.warn('Aviso: Verificação de estoque pré-checkout falhou ou Prisma offline:', stockCheckErr.message);
    }

    // 3. Registra a venda como PENDENTE no banco de dados local/Supabase
    let vendaId: number | null = null;
    try {
      const venda = await prisma.venda.create({
        data: {
          total: cleanTotal,
          metodo_pagamento: paymentMethod === 'credit_card' ? 'CARTAO_CREDITO' : 'PIX',
          status: 'PENDENTE',
          cpf_cnpj_cliente: cleanDoc,
          itens: {
            create: items.map((item: any) => ({
              produto_ean: String(item.ean || 'EAN-GERAL'),
              quantidade: Math.max(1, parseInt(item.quantity, 10) || 1),
              preco_unitario: Number(item.unit_price) || 0,
              produto_nome: String(item.title || 'Produto').slice(0, 255),
            })),
          },
        },
      });
      vendaId = venda.id;
      console.log(`[Checkout] Venda #${vendaId} registrada com sucesso via Prisma.`);
    } catch (dbErr: any) {
      console.warn('[Checkout] Prisma indisponível, tentando persistência via Supabase REST API:', dbErr.message);
    }

    // Fallback: Se o Prisma falhou no Serverless, insere diretamente via Supabase REST API (HTTPS)
    if (!vendaId) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rgggdawwkmcnpfetuhij.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey) {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const sbClient = createClient(supabaseUrl, supabaseKey);
          const { data: vData, error: vErr } = await sbClient
            .from('vendas')
            .insert({
              total: cleanTotal,
              metodo_pagamento: paymentMethod === 'credit_card' ? 'CARTAO_CREDITO' : 'PIX',
              status: 'PENDENTE',
              cpf_cnpj_cliente: cleanDoc,
            })
            .select('id')
            .single();

          if (vErr) {
            console.error('[Checkout] Erro ao persistir venda no Supabase REST:', vErr);
          } else if (vData) {
            vendaId = vData.id;
            console.log(`[Checkout] Venda #${vendaId} registrada com sucesso via Supabase REST.`);

            const itensPayload = items.map((item: any) => ({
              venda_id: vendaId,
              produto_ean: String(item.ean || 'EAN-GERAL'),
              quantidade: Math.max(1, parseInt(item.quantity, 10) || 1),
              preco_unitario: Number(item.unit_price) || 0,
              produto_nome: String(item.title || 'Produto').slice(0, 255),
            }));

            const { error: itemsErr } = await sbClient.from('vendas_itens').insert(itensPayload);
            if (itemsErr) {
              console.warn('[Checkout] Aviso ao salvar itens no Supabase REST:', itemsErr);
            }
          }
        } catch (sbEx: any) {
          console.error('[Checkout] Exceção ao persistir no Supabase REST:', sbEx.message);
        }
      }
    }

    if (!vendaId) {
      vendaId = Math.floor(Date.now() / 1000);
      console.warn('[Checkout] Banco de dados temporariamente inacessível, gerando ID temporário:', vendaId);
    }

    // 3. Chamada à API oficial de Orders do Mercado Pago (/v1/orders)
    const orderData = await createMercadoPagoOrder({
      vendaId,
      total: cleanTotal,
      email,
      firstName: firstName || 'Cliente',
      lastName: lastName || 'Tailândia',
      docType,
      docNumber: cleanDoc,
      paymentMethod,
      cardToken,
      cardPaymentMethodId,
      installments: Number(installments) || 1,
    });

    const paymentInfo = orderData.transactions?.payments?.[0];

    // Resposta para PIX
    if (paymentMethod === 'pix') {
      const pixMethod = paymentInfo?.payment_method;
      return NextResponse.json({
        success: true,
        orderId: orderData.id,
        vendaId,
        status: orderData.status,
        qrCodeBase64: pixMethod?.qr_code_base64 || '',
        qrCodeCopiaECola: pixMethod?.qr_code || '',
        ticketUrl: pixMethod?.ticket_url || '',
      });
    }

    // Resposta para Cartão de Crédito
    return NextResponse.json({
      success: true,
      orderId: orderData.id,
      vendaId,
      status: paymentInfo?.status || orderData.status,
      statusDetail: paymentInfo?.status_detail,
    });
  } catch (error: any) {
    console.error('Erro na rota /api/mercadopago/checkout (Orders API):', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Erro interno ao processar pedido.',
      },
      { status: 500 }
    );
  }
}
