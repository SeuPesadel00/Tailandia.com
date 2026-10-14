'use client';

import { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { formatBRL } from '../../services/cart';
import {
  ArrowLeft,
  Copy,
  CheckCircle2,
  AlertCircle,
  Loader2,
  QrCode,
  CreditCard,
  ShieldCheck,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, deliveryFee, subtotal, discount, clearCart } = useCart();

  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    docNumber: '', // CPF
  });

  // Estado para Cartão de Crédito
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardholderName: '',
    cardExpirationMonth: '',
    cardExpirationYear: '',
    securityCode: '',
    installments: 1,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pixData, setPixData] = useState<{
    qrCodeBase64: string;
    qrCodeCopiaECola: string;
    ticketUrl?: string;
    vendaId: number;
    orderId?: string;
  } | null>(null);
  const [cardSuccess, setCardSuccess] = useState<{
    vendaId: number;
    orderId?: string;
    status: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [mpReady, setMpReady] = useState(false);

  // Redireciona se carrinho estiver vazio e não houver pagamento iniciado
  useEffect(() => {
    if (items.length === 0 && !pixData && !cardSuccess) {
      router.push('/');
    }
  }, [items, pixData, cardSuccess, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCardData((prev) => ({ ...prev, [name]: value }));
  };

  const formatCpf = (val: string) => {
    const nums = val.replace(/\D/g, '').slice(0, 11);
    if (nums.length <= 3) return nums;
    if (nums.length <= 6) return `${nums.slice(0, 3)}.${nums.slice(3)}`;
    if (nums.length <= 9) return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6)}`;
    return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6, 9)}-${nums.slice(9)}`;
  };

  const formatCardNumber = (val: string) => {
    return val
      .replace(/\D/g, '')
      .slice(0, 16)
      .replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const validarCPF = (cpf: string) => {
    const clean = (cpf || '').replace(/\D/g, '');
    if (clean.length !== 11) return false;
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
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanCpf = formData.docNumber.replace(/\D/g, '');
    if (!formData.firstName || !formData.email) {
      setError('Por favor, informe seu nome e e-mail.');
      return;
    }

    if (!validarCPF(cleanCpf)) {
      setError('CPF inválido. O Banco Central e o Mercado Pago exigem um CPF com dígitos verificadores válidos. Em ambiente de teste Sandbox, utilize: 191.191.191-00');
      return;
    }

    setLoading(true);

    try {
      let cardToken: string | undefined;
      let cardPaymentMethodId: string | undefined;

      // Se for Cartão de Crédito, gera o token no Mercado Pago
      if (paymentMethod === 'credit_card') {
        const cleanCard = cardData.cardNumber.replace(/\s/g, '');
        if (cleanCard.length < 15 || !cardData.securityCode || !cardData.cardExpirationMonth || !cardData.cardExpirationYear) {
          setError('Por favor, preencha todos os dados do cartão de crédito corretamente.');
          setLoading(false);
          return;
        }

        const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || 'APP_USR-1044fea6-0b89-4710-a525-01fcb3d60cbf';
        const mp = (window as any).MercadoPago ? new (window as any).MercadoPago(publicKey) : null;

        if (mp) {
          try {
            const tokenResponse = await mp.createCardToken({
              cardNumber: cleanCard,
              cardholderName: cardData.cardholderName || `${formData.firstName} ${formData.lastName}`,
              cardExpirationMonth: cardData.cardExpirationMonth.padStart(2, '0'),
              cardExpirationYear: cardData.cardExpirationYear.length === 2 ? `20${cardData.cardExpirationYear}` : cardData.cardExpirationYear,
              securityCode: cardData.securityCode,
              identificationType: 'CPF',
              identificationNumber: cleanCpf,
            });
            cardToken = tokenResponse.id;

            // Identifica bandeira pelo BIN
            try {
              const bin = cleanCard.slice(0, 6);
              const pmResult = await mp.getPaymentMethods({ bin });
              if (pmResult?.results?.[0]?.id) {
                cardPaymentMethodId = pmResult.results[0].id;
              }
            } catch {
              cardPaymentMethodId = 'credit_card';
            }
          } catch (tokErr: any) {
            setError(tokErr.message || 'Dados do cartão inválidos. Verifique número, validade e CVV.');
            setLoading(false);
            return;
          }
        }
      }

      // Envia para a API de Orders no backend
      const response = await fetch('/api/mercadopago/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          total,
          items: items.map((item) => ({
            ean: item.product.ean,
            title: item.product.nome,
            quantity: item.quantity,
            unit_price: item.product.preco_promocional || item.product.preco_venda,
          })),
          email: formData.email.trim(),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          docType: 'CPF',
          docNumber: cleanCpf,
          paymentMethod,
          cardToken,
          cardPaymentMethodId,
          installments: Number(cardData.installments) || 1,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Erro ao processar pedido com o Mercado Pago. Tente novamente.');
        setLoading(false);
        return;
      }

      // Sucesso PIX
      if (paymentMethod === 'pix' && data.qrCodeBase64) {
        setPixData({
          qrCodeBase64: data.qrCodeBase64,
          qrCodeCopiaECola: data.qrCodeCopiaECola,
          ticketUrl: data.ticketUrl,
          vendaId: data.vendaId,
          orderId: data.orderId,
        });
        clearCart();
      } else if (paymentMethod === 'credit_card') {
        // Sucesso Cartão
        setCardSuccess({
          vendaId: data.vendaId,
          orderId: data.orderId,
          status: data.status,
        });
        clearCart();
      } else {
        setError('Resposta inesperada da operadora. Por favor, tente novamente.');
      }
    } catch (err: any) {
      console.error('Erro na finalização do pedido:', err);
      setError('Erro de conexão ao processar o pagamento.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (pixData?.qrCodeCopiaECola) {
      navigator.clipboard.writeText(pixData.qrCodeCopiaECola);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <>
      <Script
        src="https://sdk.mercadopago.com/js/v2"
        strategy="lazyOnload"
        onLoad={() => setMpReady(true)}
      />

      <div className="min-h-screen bg-slate-950 text-slate-100 pt-16 sm:pt-20 pb-12 px-3 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Botão Voltar */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition text-xs sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o catálogo
          </button>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">
            
            {/* Seção Principal - Formulário / Resultado */}
            <div className="flex-1 p-5 sm:p-8 lg:border-r border-slate-800">
              
              {/* CASO 1: PIX GERADO */}
              {pixData ? (
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 mb-2">
                    Pedido #{pixData.vendaId} Criado com Sucesso
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white mb-2">Pague com PIX Instantâneo</h2>
                  <p className="text-xs sm:text-sm text-slate-400 mb-6 max-w-md">
                    Abra o app do seu banco e escaneie o QR Code abaixo ou utilize o código Copia e Cola.
                  </p>

                  {/* QR Code Container */}
                  <div className="bg-white p-4 rounded-2xl mb-6 shadow-xl border border-slate-200">
                    <img
                      src={`data:image/jpeg;base64,${pixData.qrCodeBase64}`}
                      alt="QR Code Pix Mercado Pago"
                      className="w-44 h-44 sm:w-52 sm:h-52 object-contain"
                    />
                  </div>

                  {/* Pix Copia e Cola */}
                  <div className="w-full max-w-md">
                    <p className="text-xs text-slate-400 font-semibold mb-2 uppercase tracking-wider text-left">
                      Pix Copia e Cola:
                    </p>
                    <div className="flex bg-slate-950 border border-slate-700 rounded-xl overflow-hidden w-full">
                      <input
                        type="text"
                        readOnly
                        value={pixData.qrCodeCopiaECola}
                        className="flex-1 bg-transparent px-3.5 py-3 text-xs text-slate-300 outline-none truncate"
                      />
                      <button
                        onClick={copyToClipboard}
                        className={`px-4 py-3 font-bold text-xs flex items-center gap-1.5 transition ${
                          copied
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                        }`}
                      >
                        {copied ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" /> Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" /> Copiar
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {pixData.ticketUrl && (
                    <a
                      href={pixData.ticketUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 underline"
                    >
                      <span>Abrir comprovante oficial do Mercado Pago</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}

                  <div className="mt-6 flex items-center gap-2 text-xs text-emerald-400 font-semibold animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Aguardando confirmação do pagamento em tempo real...
                  </div>
                </div>
              ) : cardSuccess ? (
                /* CASO 2: CARTÃO PROCESSADO */
                <div className="flex flex-col items-center text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h2 className="text-2xl font-black text-white mb-2">Pagamento Processado!</h2>
                  <p className="text-sm text-slate-300 mb-6">
                    Seu pedido <strong>#{cardSuccess.vendaId}</strong> foi recebido com sucesso e já está sendo preparado pela nossa equipe em Taguatinga!
                  </p>
                  <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 w-full max-w-sm mb-6 text-xs text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Status Mercado Pago:</span>
                      <strong className="text-emerald-400 uppercase">{cardSuccess.status}</strong>
                    </div>
                    {cardSuccess.orderId && (
                      <div className="flex justify-between">
                        <span>Ref. Pedido:</span>
                        <span className="font-mono">{cardSuccess.orderId}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => router.push('/')}
                    className="rounded-xl bg-amber-500 hover:bg-amber-400 px-6 py-3 text-xs font-bold text-slate-950 transition"
                  >
                    Voltar para a Loja
                  </button>
                </div>
              ) : (
                /* CASO 3: FORMULÁRIO DE CHECKOUT TRANSPARENTE */
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-white">Checkout Transparente</h2>
                      <p className="text-xs text-slate-400">Finalize com segurança garantida pelo Mercado Pago</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                      <Lock className="h-3.5 w-3.5" /> Ambiente Seguro
                    </div>
                  </div>

                  {/* Seletor de Método de Pagamento */}
                  <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Escolha a Forma de Pagamento
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('pix')}
                        className={`flex items-center justify-center gap-2.5 p-3.5 rounded-xl border font-bold text-xs sm:text-sm transition ${
                          paymentMethod === 'pix'
                            ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-md shadow-emerald-500/10'
                            : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        <QrCode className="h-4 w-4" />
                        <span>PIX Instantâneo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('credit_card')}
                        className={`flex items-center justify-center gap-2.5 p-3.5 rounded-xl border font-bold text-xs sm:text-sm transition ${
                          paymentMethod === 'credit_card'
                            ? 'border-amber-500 bg-amber-500/15 text-amber-400 shadow-md shadow-amber-500/10'
                            : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        <CreditCard className="h-4 w-4" />
                        <span>Cartão de Crédito</span>
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleSubmitOrder} className="space-y-4">
                    {/* Dados Pessoais */}
                    <div className="space-y-3">
                      <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                        1. Dados do Comprador
                      </span>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Nome *</label>
                          <input
                            type="text"
                            name="firstName"
                            placeholder="Ex: João"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            required
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Sobrenome *</label>
                          <input
                            type="text"
                            name="lastName"
                            placeholder="Ex: Silva"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            required
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">E-mail para Recibo *</label>
                          <input
                            type="email"
                            name="email"
                            placeholder="seu@email.com"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs text-slate-400">CPF (apenas números) *</label>
                            <button
                              type="button"
                              onClick={() => setFormData((prev) => ({ ...prev, docNumber: '191.191.191-00' }))}
                              className="text-[10px] text-amber-400 hover:text-amber-300 font-mono underline decoration-dotted"
                              title="Preencher com CPF de teste homologado para Sandbox do Mercado Pago"
                            >
                              Usar CPF Sandbox
                            </button>
                          </div>
                          <input
                            type="text"
                            name="docNumber"
                            placeholder="000.000.000-00"
                            value={formatCpf(formData.docNumber)}
                            onChange={handleInputChange}
                            maxLength={14}
                            required
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                          />
                          <span className="text-[10px] text-slate-500 block mt-1">
                            Exigido pelo BACEN / Mercado Pago. Para testes Sandbox: <span className="text-slate-400 font-mono">191.191.191-00</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Campos de Cartão se Cartão de Crédito estiver selecionado */}
                    {paymentMethod === 'credit_card' && (
                      <div className="space-y-3 pt-3 border-t border-slate-800">
                        <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                          2. Dados do Cartão de Crédito
                        </span>

                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Número do Cartão *</label>
                          <input
                            type="text"
                            name="cardNumber"
                            placeholder="0000 0000 0000 0000"
                            value={formatCardNumber(cardData.cardNumber)}
                            onChange={handleCardChange}
                            maxLength={19}
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Nome Impresso no Cartão *</label>
                          <input
                            type="text"
                            name="cardholderName"
                            placeholder="COMO ESTÁ NO CARTÃO"
                            value={cardData.cardholderName}
                            onChange={handleCardChange}
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none uppercase"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Mês *</label>
                            <input
                              type="text"
                              name="cardExpirationMonth"
                              placeholder="MM"
                              maxLength={2}
                              value={cardData.cardExpirationMonth}
                              onChange={handleCardChange}
                              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Ano *</label>
                            <input
                              type="text"
                              name="cardExpirationYear"
                              placeholder="AA"
                              maxLength={4}
                              value={cardData.cardExpirationYear}
                              onChange={handleCardChange}
                              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">CVV *</label>
                            <input
                              type="password"
                              name="securityCode"
                              placeholder="123"
                              maxLength={4}
                              value={cardData.securityCode}
                              onChange={handleCardChange}
                              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none text-center"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Opções de Parcelamento</label>
                          <select
                            name="installments"
                            value={cardData.installments}
                            onChange={handleCardChange}
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none cursor-pointer"
                          >
                            <option value="1">1x de {formatBRL(total)} (à vista)</option>
                            <option value="2">2x de {formatBRL(total / 2)}</option>
                            <option value="3">3x de {formatBRL(total / 3)}</option>
                            <option value="4">4x de {formatBRL(total / 4)}</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {error && (
                      <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3.5 rounded-xl flex items-center gap-2.5 text-xs">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className={`w-full mt-6 flex items-center justify-center gap-2 rounded-xl py-3.5 px-4 font-bold text-xs sm:text-sm active:scale-[0.98] transition disabled:opacity-70 shadow-lg ${
                        paymentMethod === 'pix'
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                      }`}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Processando na API Mercado Pago...</span>
                        </>
                      ) : paymentMethod === 'pix' ? (
                        <>
                          <QrCode className="h-4 w-4" />
                          <span>Gerar PIX • {formatBRL(total)}</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4" />
                          <span>Pagar com Cartão • {formatBRL(total)}</span>
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>

            {/* Seção Lateral Direita - Resumo Financeiro */}
            <div className="w-full lg:w-80 bg-slate-950/60 p-5 sm:p-7 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white mb-4">Resumo do Pedido</h3>

                <div className="space-y-3 mb-6 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                  {items.length > 0 ? (
                    items.map((item) => (
                      <div key={item.product.id} className="flex gap-2.5 items-center">
                        <div className="relative h-11 w-11 shrink-0 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden">
                          <img
                            src={item.product.imagem_url}
                            alt={item.product.nome}
                            className="object-cover h-full w-full"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=200&auto=format&fit=crop&q=80';
                            }}
                          />
                          <div className="absolute -top-1 -right-1 bg-slate-700 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                            {item.quantity}
                          </div>
                        </div>
                        <div className="flex-1 text-xs min-w-0">
                          <p className="font-semibold text-white truncate">{item.product.nome}</p>
                          <p className="text-slate-400">
                            {formatBRL((item.product.preco_promocional || item.product.preco_venda) * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">Pedido #{pixData?.vendaId || cardSuccess?.vendaId}</p>
                  )}
                </div>

                <div className="border-t border-slate-800 pt-4 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span>{formatBRL(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Taxa de Entrega</span>
                    <span>{deliveryFee === 0 ? 'Grátis' : formatBRL(deliveryFee)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Desconto</span>
                      <span>-{formatBRL(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-amber-400 pt-2 border-t border-slate-800">
                    <span>Total a Pagar</span>
                    <span>{formatBRL(total)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800">
                <div className="rounded-xl bg-slate-900/80 border border-slate-800/80 p-3 text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-white">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span>Mercado Pago Transparente</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Seus dados são criptografados com certificado PCI de nível bancário.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
