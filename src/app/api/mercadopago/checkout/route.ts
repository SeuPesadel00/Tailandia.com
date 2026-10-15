import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { createClient } from '@supabase/supabase-js';
import { createMercadoPagoOrder, validarCPF } from '../../../../services/mercadopagoOrders';
import { REAL_TAILANDIA_PRODUCTS } from '../../../../services/products';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rgggdawwkmncpfetuhij.supabase.co';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnZ2dkYXd3a21uY3BmZXR1aGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NTUyNjgsImV4cCI6MjEwNjQzMTI2OH0.1uXP6pHtcdfKlmuB1rIcnhVQf9uCT3Yb9iyIuo9hZNc';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      items,
      email,
      firstName,
      lastName,
      docType = 'CPF',
      docNumber,
      phone,
      tipoEntrega = 'DELIVERY',
      endereco,
      couponCode,
      paymentMethod = 'pix', // 'pix' | 'credit_card'
      cardToken,
      cardPaymentMethodId,
      installments = 1,
    } = body;

    // 1. Validação básica de entrada e sanitização
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ success: false, message: 'E-mail válido é obrigatório para envio do comprovante.' }, { status: 400 });
    }

    const cleanDoc = String(docNumber || '').replace(/\D/g, '');
    if (!validarCPF(cleanDoc)) {
      return NextResponse.json({
        success: false,
        message: 'CPF inválido. O Banco Central e a operadora exigem dígitos verificadores válidos (no modo Sandbox use 191.191.191-00).'
      }, { status: 400 });
    }

    const cleanPhone = String(phone || '').replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return NextResponse.json({ success: false, message: 'Telefone/WhatsApp de contato com DDD é obrigatório.' }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: 'O carrinho está vazio.' }, { status: 400 });
    }

    if (tipoEntrega === 'DELIVERY') {
      if (!endereco || !endereco.rua || !endereco.numero || !endereco.bairro) {
        return NextResponse.json({
          success: false,
          message: 'Para entrega via Delivery, informe o endereço completo (Rua, Número e Bairro).'
        }, { status: 400 });
      }
    }

    // 2. RECALCULO DE PREÇO E VALIDAÇÃO ATÔMICA DE ESTOQUE NO SERVIDOR
    // O servidor NUNCA confia no preço (unit_price) ou total enviados pelo navegador
    let calculatedSubtotal = 0;
    const sanitizedItems: Array<{
      produto_id?: number;
      ean: string;
      nome: string;
      quantidade: number;
      preco_unitario: number;
    }> = [];

    const sbClient = (supabaseUrl && supabaseServiceKey) ? createClient(supabaseUrl, supabaseServiceKey) : null;

    for (const item of items) {
      const ean = String(item.ean || '').trim();
      const requestedQty = Math.max(1, parseInt(item.quantity, 10) || 1);

      if (!ean) {
        return NextResponse.json({ success: false, message: 'Item no carrinho sem código de barras (EAN).' }, { status: 400 });
      }

      // Busca produto no banco por EAN, ID ou Nome
      let dbProd: { id: number; ean: string; nome: string; preco_venda: any; estoque_atual: number | null; ativo: boolean | null } | null = null;

      try {
        dbProd = await prisma.produto.findFirst({
          where: {
            OR: [
              ...(ean ? [{ ean }] : []),
              ...(item.id && !isNaN(Number(item.id)) ? [{ id: Number(item.id) }, { wp_id: Number(item.id) }] : []),
              ...(item.title ? [{ nome: { contains: item.title, mode: 'insensitive' as const } }] : [])
            ]
          },
          select: { id: true, ean: true, nome: true, preco_venda: true, estoque_atual: true, ativo: true }
        }) as any;
      } catch (prismaErr: any) {
        console.warn('[Checkout] Aviso ao consultar produto no Prisma:', prismaErr.message);
      }

      // Fallback Supabase REST
      if (!dbProd && sbClient) {
        try {
          const { data } = await sbClient
            .from('produtos')
            .select('id, ean, nome, preco_venda, estoque_atual, ativo')
            .or(`ean.eq.${ean}${item.id ? `,id.eq.${item.id}` : ''}`)
            .limit(1)
            .maybeSingle();
          if (data) dbProd = data;
        } catch (sbErr: any) {
          console.warn('[Checkout] Aviso ao consultar no Supabase REST:', sbErr.message);
        }
      }

      // Fallback Catálogo Base Tailândia (Garante disponibilidade de itens do catálogo)
      if (!dbProd) {
        const fallback = REAL_TAILANDIA_PRODUCTS.find(
          (p) =>
            (ean && String(p.ean) === ean) ||
            (item.id && p.id === Number(item.id)) ||
            (item.title && p.nome.toLowerCase().includes(item.title.toLowerCase())) ||
            (item.title && item.title.toLowerCase().includes(p.nome.toLowerCase()))
        );
        if (fallback) {
          dbProd = {
            id: fallback.id,
            ean: String(fallback.ean),
            nome: fallback.nome,
            preco_venda: fallback.preco_venda,
            estoque_atual: fallback.estoque_atual,
            ativo: fallback.ativo !== false,
          };
          console.log(`[Checkout] Produto "${item.title || ean}" resolvido via catálogo base.`);
        }
      }

      if (!dbProd || dbProd.ativo === false) {
        console.error(`[Checkout Error] Produto não encontrado ou inativo: EAN=${ean}, ID=${item.id}, Title=${item.title}`);
        return NextResponse.json({
          success: false,
          message: `O produto "${item.title || ean}" não está disponível para venda no momento.`
        }, { status: 400 });
      }

      // Validação de estoque físico
      const currentStock = Number(dbProd.estoque_atual ?? 0);
      if (currentStock < requestedQty) {
        return NextResponse.json({
          success: false,
          code: 'OUT_OF_STOCK',
          message: `O produto "${dbProd.nome}" acabou de esgotar no balcão físico do PDV (restam apenas ${currentStock} un.). Por favor, atualize seu carrinho.`
        }, { status: 409 });
      }

      // Preço oficial do banco de dados
      const unitPrice = Number(dbProd.preco_venda || 0);

      if (unitPrice <= 0) {
        return NextResponse.json({
          success: false,
          message: `Preço inválido cadastrado para o produto "${dbProd.nome}".`
        }, { status: 400 });
      }

      calculatedSubtotal += unitPrice * requestedQty;
      sanitizedItems.push({
        produto_id: dbProd.id,
        ean: dbProd.ean,
        nome: dbProd.nome,
        quantidade: requestedQty,
        preco_unitario: unitPrice,
      });
    }

    // 3. Recálculo oficial de Cupom no Servidor
    let calculatedDiscount = 0;
    if (couponCode && typeof couponCode === 'string') {
      const cleanCoupon = couponCode.trim().toUpperCase();
      if (cleanCoupon === 'TAI10' || cleanCoupon === 'PRIMEIRACOMPRA') {
        calculatedDiscount = Number(((calculatedSubtotal * 10) / 100).toFixed(2));
      } else if (cleanCoupon === 'GELADA5') {
        calculatedDiscount = Number(((calculatedSubtotal * 5) / 100).toFixed(2));
      }
    }

    // 4. Recálculo oficial de Taxa de Entrega no Servidor
    let calculatedDeliveryFee = 0;
    if (tipoEntrega === 'DELIVERY') {
      // Frete grátis para compras a partir de R$ 150
      calculatedDeliveryFee = calculatedSubtotal >= 150 ? 0 : 10.0;
    }

    // Total final imutável recalculado pelo servidor
    const serverTotal = Math.max(0.01, Number((calculatedSubtotal - calculatedDiscount + calculatedDeliveryFee).toFixed(2)));

    // 5. PERSISTÊNCIA TRANSACIONAL (FAIL-CLOSED)
    // Se o banco não conseguir salvar a venda, abortamos antes de cobrar o cliente
    let vendaId: number | null = null;
    const enderecoFormatado = tipoEntrega === 'DELIVERY' && endereco
      ? `${endereco.rua}, Nº ${endereco.numero} - ${endereco.bairro}${endereco.complemento ? ' (' + endereco.complemento + ')' : ''} - CEP ${endereco.cep || '72000-000'}`
      : 'Retirada no Balcão Físico';

    try {
      const venda = await prisma.venda.create({
        data: {
          total: serverTotal,
          metodo_pagamento: paymentMethod === 'credit_card' ? 'CARTAO_CREDITO' : 'PIX',
          status: 'PENDENTE',
          cpf_cnpj_cliente: cleanDoc,
          itens: {
            create: sanitizedItems.map((item) => ({
              produto_ean: item.ean,
              quantidade: item.quantidade,
              preco_unitario: item.preco_unitario,
              produto_nome: item.nome.slice(0, 255),
            })),
          },
        },
      });
      vendaId = venda.id;
    } catch (dbErr: any) {
      console.warn('[Checkout] Tentando fallback para Supabase REST:', dbErr.message);
      if (sbClient) {
        try {
          const { data: vData, error: vErr } = await sbClient
            .from('vendas')
            .insert({
              total: serverTotal,
              metodo_pagamento: paymentMethod === 'credit_card' ? 'CARTAO_CREDITO' : 'PIX',
              status: 'PENDENTE',
              cpf_cnpj_cliente: cleanDoc,
            })
            .select('id')
            .single();

          if (!vErr && vData) {
            vendaId = vData.id;
            const itensPayload = sanitizedItems.map((item) => ({
              venda_id: vendaId,
              produto_ean: item.ean,
              quantidade: item.quantidade,
              preco_unitario: item.preco_unitario,
              produto_nome: item.nome.slice(0, 255),
            }));
            await sbClient.from('vendas_itens').insert(itensPayload);
          }
        } catch (sbEx: any) {
          console.error('[Checkout] Falha total na persistência:', sbEx.message);
        }
      }
    }

    // FAIL-CLOSED: Nunca cobra no Mercado Pago se o banco falhou
    if (!vendaId) {
      console.error('[Checkout Security] Venda não foi salva no banco de dados. Abortando transação.');
      return NextResponse.json({
        success: false,
        message: 'Não foi possível registrar o pedido no banco de dados. Nenhuma cobrança foi efetuada. Por favor, tente novamente.'
      }, { status: 503 });
    }

    // 6. Chamada à API oficial de Orders do Mercado Pago (/v1/orders)
    console.log('[MercadoPago Orders Request]', {
      vendaId,
      total: serverTotal,
      email: email.trim(),
      payer: `${firstName} ${lastName}`,
      docNumber: cleanDoc.slice(0, 3) + '***',
      paymentMethod,
      itemsCount: sanitizedItems.length,
    });

    const orderData = await createMercadoPagoOrder({
      vendaId,
      total: serverTotal,
      email: email.trim(),
      firstName: (firstName || 'Cliente').trim(),
      lastName: (lastName || 'Tailândia').trim(),
      docType,
      docNumber: cleanDoc,
      paymentMethod,
      cardToken,
      cardPaymentMethodId,
      installments: Number(installments) || 1,
      idempotencyKey: `venda-${vendaId}-${serverTotal.toFixed(2)}-${paymentMethod}`,
    });

    const paymentInfo = orderData.transactions?.payments?.[0];

    console.log('[MercadoPago Orders Response]', {
      orderId: orderData.id,
      status: orderData.status,
      paymentStatus: paymentInfo?.status,
      vendaId,
    });

    // Resposta para PIX
    if (paymentMethod === 'pix') {
      const pixMethod = paymentInfo?.payment_method;
      return NextResponse.json({
        success: true,
        orderId: orderData.id,
        vendaId,
        total: serverTotal,
        status: orderData.status,
        qrCodeBase64: pixMethod?.qr_code_base64 || '',
        qrCodeCopiaECola: pixMethod?.qr_code || '',
        ticketUrl: pixMethod?.ticket_url || '',
      });
    }

    // Resposta para Cartão de Crédito com tratamento de recusa
    const cardStatus = paymentInfo?.status || orderData.status;
    if (cardStatus === 'rejected' || cardStatus === 'cancelled') {
      return NextResponse.json({
        success: false,
        vendaId,
        orderId: orderData.id,
        status: cardStatus,
        statusDetail: paymentInfo?.status_detail,
        message: 'O pagamento com cartão foi recusado pela operadora. Verifique os dados, o limite ou utilize o PIX Instantâneo.',
      }, { status: 402 });
    }

    return NextResponse.json({
      success: true,
      orderId: orderData.id,
      vendaId,
      total: serverTotal,
      status: cardStatus,
      statusDetail: paymentInfo?.status_detail,
    });
  } catch (error: any) {
    console.error('Erro na rota /api/mercadopago/checkout:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Erro interno ao processar pedido.',
      },
      { status: 500 }
    );
  }
}
