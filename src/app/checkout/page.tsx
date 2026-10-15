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
  Truck,
  Store,
  Phone,
  MapPin,
  MessageCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

interface OrderSummarySnapshot {
  items: Array<{
    id: number;
    nome: string;
    imagem_url: string;
    preco: number;
    quantity: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
}

interface ConfirmedPaymentData {
  vendaId: number;
  orderId?: string;
  total: number;
  method: 'PIX Instantâneo' | 'Cartão de Crédito';
  status: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    total,
    deliveryFee,
    subtotal,
    discount,
    deliveryType,
    setDeliveryType,
    customerName,
    setCustomerName,
    couponCode,
    clearCart,
  } = useCart();

  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    docNumber: '', // CPF
    phone: '',
    cep: '72000-000',
    rua: '',
    numero: '',
    bairro: 'Taguatinga',
    complemento: '',
  });

  // Reidratação automática de estado compartilhado (Nome e Modalidade da Sidebar / LocalStorage)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedType = localStorage.getItem('tailandia_delivery_type');
      if (savedType === 'RETIRADA' || savedType === 'DELIVERY') {
        setDeliveryType(savedType);
      }

      const storedName = customerName || localStorage.getItem('tailandia_customer_name') || '';
      const savedFormRaw = localStorage.getItem('tailandia_checkout_form');
      let savedForm: any = {};
      try {
        if (savedFormRaw) savedForm = JSON.parse(savedFormRaw);
      } catch {}

      let fName = savedForm.firstName || '';
      let lName = savedForm.lastName || '';

      if (!fName && storedName) {
        const parts = storedName.trim().split(/\s+/);
        fName = parts[0] || '';
        lName = parts.slice(1).join(' ') || '';
      }

      setFormData((prev) => ({
        ...prev,
        ...savedForm,
        firstName: fName || prev.firstName,
        lastName: lName || prev.lastName,
      }));
    }
  }, [customerName, setDeliveryType]);

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
  const [orderSummary, setOrderSummary] = useState<OrderSummarySnapshot | null>(null);

  // Estados de Pagamento e Polling
  const [pixData, setPixData] = useState<{
    qrCodeBase64: string;
    qrCodeCopiaECola: string;
    ticketUrl?: string;
    vendaId: number;
    orderId?: string;
    total: number;
  } | null>(null);

  const [confirmedPayment, setConfirmedPayment] = useState<ConfirmedPaymentData | null>(null);
  const [copied, setCopied] = useState(false);
  const [mpReady, setMpReady] = useState(false);

  // Redireciona se carrinho estiver vazio e não houver pagamento iniciado
  useEffect(() => {
    if (items.length === 0 && !pixData && !confirmedPayment) {
      router.push('/');
    }
  }, [items, pixData, confirmedPayment, router]);

  // POLLING EM TEMPO REAL PARA CONFIRMAÇÃO DO PIX
  useEffect(() => {
    if (!pixData || confirmedPayment) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const queryParams = new URLSearchParams();
        if (pixData.vendaId) queryParams.set('vendaId', String(pixData.vendaId));
        if (pixData.orderId) queryParams.set('orderId', pixData.orderId);

        const res = await fetch(`/api/mercadopago/order-status?${queryParams.toString()}`);
        if (!res.ok) return;

        const data = await res.json();
        if (!isMounted) return;

        // Se o pagamento foi concluído e recebido
        if (data.isPaid || data.status === 'CONCLUIDA') {
          clearInterval(interval);
          setConfirmedPayment({
            vendaId: pixData.vendaId,
            orderId: pixData.orderId,
            total: Number(data.total || pixData.total),
            method: 'PIX Instantâneo',
            status: 'APROVADO',
          });
          setPixData(null);
        } else if (data.status === 'REJEITADA' || data.status === 'CANCELADA') {
          clearInterval(interval);
          setError(data.statusDetail || 'O pagamento PIX expirou ou foi cancelado. Por favor, tente novamente.');
          setPixData(null);
        }
      } catch (pollErr) {
        console.warn('Erro ao verificar status do pagamento PIX:', pollErr);
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [pixData, confirmedPayment]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (typeof window !== 'undefined') {
        localStorage.setItem('tailandia_checkout_form', JSON.stringify(updated));
        if (name === 'firstName' || name === 'lastName') {
          const fullName = `${name === 'firstName' ? value : updated.firstName} ${name === 'lastName' ? value : updated.lastName}`.trim();
          setCustomerName(fullName);
        }
      }
      return updated;
    });
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

  const formatPhone = (val: string) => {
    const nums = val.replace(/\D/g, '').slice(0, 11);
    if (nums.length <= 2) return nums;
    if (nums.length <= 7) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
    return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
  };

  const formatCep = (val: string) => {
    const nums = val.replace(/\D/g, '').slice(0, 8);
    if (nums.length <= 5) return nums;
    return `${nums.slice(0, 5)}-${nums.slice(5)}`;
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
    const cleanPhone = formData.phone.replace(/\D/g, '');

    if (!formData.firstName || !formData.email) {
      setError('Por favor, informe seu nome e e-mail.');
      return;
    }

    if (cleanPhone.length < 10) {
      setError('Por favor, informe um WhatsApp/telefone de contato com DDD válido.');
      return;
    }

    if (!validarCPF(cleanCpf)) {
      setError('CPF inválido. O Banco Central e o Mercado Pago exigem um CPF com dígitos verificadores válidos. Em ambiente de teste Sandbox, utilize: 191.191.191-00');
      return;
    }

    if (deliveryType === 'DELIVERY') {
      if (!formData.rua.trim() || !formData.numero.trim() || !formData.bairro.trim()) {
        setError('Por favor, informe a rua, número e bairro para entrega.');
        return;
      }
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

      // Snapshot dos itens antes de limpar o carrinho
      const summarySnapshot: OrderSummarySnapshot = {
        items: items.map((i) => ({
          id: i.product.id,
          nome: i.product.nome,
          imagem_url: i.product.imagem_url,
          preco: i.product.preco_promocional || i.product.preco_venda,
          quantity: i.quantity,
        })),
        subtotal,
        deliveryFee,
        discount,
        total,
      };

      // Envia para o checkout no backend (os valores serão estritamente recalculados no servidor)
      const response = await fetch('/api/mercadopago/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            ean: item.product.ean,
            title: item.product.nome,
            quantity: item.quantity,
          })),
          email: formData.email.trim(),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          docType: 'CPF',
          docNumber: cleanCpf,
          phone: cleanPhone,
          tipoEntrega: deliveryType,
          endereco: deliveryType === 'DELIVERY' ? {
            cep: formData.cep,
            rua: formData.rua,
            numero: formData.numero,
            bairro: formData.bairro,
            complemento: formData.complemento,
          } : undefined,
          couponCode: couponCode || undefined,
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

      setOrderSummary(summarySnapshot);

      // Sucesso PIX
      if (paymentMethod === 'pix' && data.qrCodeBase64) {
        setPixData({
          qrCodeBase64: data.qrCodeBase64,
          qrCodeCopiaECola: data.qrCodeCopiaECola,
          ticketUrl: data.ticketUrl,
          vendaId: data.vendaId,
          orderId: data.orderId,
          total: data.total || summarySnapshot.total,
        });
        clearCart();
      } else if (paymentMethod === 'credit_card') {
        // Sucesso Cartão
        setConfirmedPayment({
          vendaId: data.vendaId,
          orderId: data.orderId,
          total: data.total || summarySnapshot.total,
          method: 'Cartão de Crédito',
          status: 'APROVADO',
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

  const getWhatsAppTrackingLink = () => {
    const pedidoNum = confirmedPayment?.vendaId || pixData?.vendaId || '';
    const valorNum = formatBRL(confirmedPayment?.total || orderSummary?.total || total);
    const msg = `Olá, acabei de pagar o pedido #${pedidoNum} (${valorNum}) no site da Tailândia Distribuidora e gostaria de acompanhar o envio!`;
    return `https://wa.me/5561999999999?text=${encodeURIComponent(msg)}`;
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
              
              {/* CASO 1: PAGAMENTO CONFIRMADO COM SUCESSO (PIX OU CARTÃO) */}
              {confirmedPayment ? (
                <div className="flex flex-col items-center text-center py-6">
                  <div className="relative mb-5">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center animate-bounce">
                      <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full animate-ping opacity-75" />
                  </div>

                  <span className="text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 mb-2">
                    Pagamento Aprovado com Sucesso!
                  </span>

                  <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
                    Pedido #{confirmedPayment.vendaId} Confirmado
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-300 mb-6 max-w-md">
                    Identificamos o seu pagamento em nossa conta via <strong>{confirmedPayment.method}</strong>! O seu pedido já foi impresso na nossa distribuidora e está sendo preparado pela equipe.
                  </p>

                  <div className="rounded-2xl bg-slate-950 border border-slate-800 p-5 w-full max-w-md mb-6 text-xs text-slate-300 space-y-2 text-left">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                      <span className="text-slate-400">Total Pago:</span>
                      <strong className="text-amber-400 text-sm font-black">{formatBRL(confirmedPayment.total)}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Modalidade:</span>
                      <span className="font-semibold text-white">
                        {deliveryType === 'DELIVERY' ? '🚚 Entrega (Delivery)' : '🏪 Retirada no Balcão'}
                      </span>
                    </div>
                    {deliveryType === 'DELIVERY' && formData.rua && (
                      <div className="flex justify-between items-start pt-1">
                        <span className="text-slate-400 shrink-0">Endereço:</span>
                        <span className="text-right text-slate-200">
                          {formData.rua}, {formData.numero} - {formData.bairro}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-1 border-t border-slate-800/60">
                      <span className="text-slate-400">Status no Mercado Pago:</span>
                      <span className="text-emerald-400 font-bold uppercase">APROVADO</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                    <a
                      href={getWhatsAppTrackingLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-3 text-xs font-bold text-white transition shadow-lg shadow-emerald-600/20"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Acompanhar no WhatsApp
                    </a>
                    <button
                      onClick={() => router.push('/')}
                      className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-3 text-xs font-bold text-white transition"
                    >
                      Fazer Novo Pedido
                    </button>
                  </div>
                </div>
              ) : pixData ? (
                /* CASO 2: AGUARDANDO PAGAMENTO DO PIX COM POLLING */
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                    <QrCode className="h-8 w-8" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 mb-2">
                    Pedido #{pixData.vendaId} Aguardando Pagamento
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white mb-1">Pague com PIX Instantâneo</h2>
                  <div className="text-2xl sm:text-3xl font-black text-amber-400 mb-2">
                    {formatBRL(pixData.total || (orderSummary ? orderSummary.total : total))}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 mb-6 max-w-md">
                    Abra o app do seu banco e escaneie o QR Code abaixo ou utilize o código Copia e Cola. O sistema confirmará automaticamente!
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

                  {/* Indicador de Polling em tempo real */}
                  <div className="mt-6 flex items-center gap-2.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-4 py-2.5 rounded-full border border-emerald-500/20">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                    <span>Aguardando transferência... A tela atualizará automaticamente ao pagar!</span>
                  </div>
                </div>
              ) : (
                /* CASO 3: FORMULÁRIO DE CHECKOUT TRANSPARENTE */
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-white">Finalizar Pedido</h2>
                      <p className="text-xs text-slate-400">Preencha seus dados de entrega e pagamento</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                      <Lock className="h-3.5 w-3.5" /> Ambiente Seguro
                    </div>
                  </div>

                  {/* Seletor de Modalidade: Entrega vs Retirada */}
                  <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      1. Modalidade de Recebimento
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setDeliveryType('DELIVERY');
                          if (typeof window !== 'undefined') localStorage.setItem('tailandia_delivery_type', 'DELIVERY');
                        }}
                        className={`flex items-center justify-center gap-2.5 p-3.5 rounded-xl border font-bold text-xs sm:text-sm transition ${
                          deliveryType === 'DELIVERY'
                            ? 'border-amber-500 bg-amber-500/15 text-amber-400 shadow-md shadow-amber-500/10'
                            : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        <Truck className="h-4 w-4" />
                        <span>Entrega (Delivery)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDeliveryType('RETIRADA');
                          if (typeof window !== 'undefined') localStorage.setItem('tailandia_delivery_type', 'RETIRADA');
                        }}
                        className={`flex items-center justify-center gap-2.5 p-3.5 rounded-xl border font-bold text-xs sm:text-sm transition ${
                          deliveryType === 'RETIRADA'
                            ? 'border-amber-500 bg-amber-500/15 text-amber-400 shadow-md shadow-amber-500/10'
                            : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        <Store className="h-4 w-4" />
                        <span>Retirar no Balcão (Grátis)</span>
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleSubmitOrder} className="space-y-4">
                    {/* Dados do Comprador */}
                    <div className="space-y-3">
                      <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                        2. Dados do Comprador
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
                          <label className="block text-xs text-slate-400 mb-1">Telefone / WhatsApp *</label>
                          <input
                            type="text"
                            name="phone"
                            placeholder="(61) 99999-9999"
                            value={formatPhone(formData.phone)}
                            onChange={handleInputChange}
                            required
                            maxLength={15}
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                          />
                        </div>
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
                          Exigido pelo BACEN / Mercado Pago. Em Sandbox: <span className="text-slate-400 font-mono">191.191.191-00</span>
                        </span>
                      </div>
                    </div>

                    {/* Endereço de Entrega caso Delivery */}
                    {deliveryType === 'DELIVERY' && (
                      <div className="space-y-3 pt-3 border-t border-slate-800">
                        <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                          3. Endereço de Entrega (Taguatinga / DF)
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block text-xs text-slate-400 mb-1">Rua / Logradouro / Quadra *</label>
                            <input
                              type="text"
                              name="rua"
                              placeholder="Ex: QND 15 Casa"
                              value={formData.rua}
                              onChange={handleInputChange}
                              required
                              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Número / Lote *</label>
                            <input
                              type="text"
                              name="numero"
                              placeholder="Ex: 24"
                              value={formData.numero}
                              onChange={handleInputChange}
                              required
                              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Bairro *</label>
                            <input
                              type="text"
                              name="bairro"
                              placeholder="Ex: Taguatinga Norte"
                              value={formData.bairro}
                              onChange={handleInputChange}
                              required
                              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Complemento / Ponto de Ref.</label>
                            <input
                              type="text"
                              name="complemento"
                              placeholder="Ex: Apto 102, próx. ao mercado"
                              value={formData.complemento}
                              onChange={handleInputChange}
                              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Forma de Pagamento */}
                    <div className="space-y-3 pt-3 border-t border-slate-800">
                      <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                        4. Escolha a Forma de Pagamento
                      </span>

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

                      {/* Campos de Cartão */}
                      {paymentMethod === 'credit_card' && (
                        <div className="space-y-3 pt-2">
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
                    </div>

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
                          <span>Processando com segurança...</span>
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
                  {(orderSummary ? orderSummary.items : items).length > 0 ? (
                    (orderSummary
                      ? orderSummary.items
                      : items.map((i) => ({
                          id: i.product.id,
                          nome: i.product.nome,
                          imagem_url: i.product.imagem_url,
                          preco: i.product.preco_promocional || i.product.preco_venda,
                          quantity: i.quantity,
                        }))
                    ).map((item) => (
                      <div key={item.id} className="flex gap-2.5 items-center">
                        <div className="relative h-11 w-11 shrink-0 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden">
                          <img
                            src={item.imagem_url}
                            alt={item.nome}
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
                          <p className="font-semibold text-white truncate">{item.nome}</p>
                          <p className="text-slate-400">
                            {formatBRL(item.preco * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">
                      Pedido #{confirmedPayment?.vendaId || pixData?.vendaId}
                    </p>
                  )}
                </div>

                <div className="border-t border-slate-800 pt-4 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span>{formatBRL(orderSummary ? orderSummary.subtotal : subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Taxa de Entrega</span>
                    <span>
                      {(orderSummary ? orderSummary.deliveryFee : deliveryFee) === 0
                        ? 'Grátis'
                        : formatBRL(orderSummary ? orderSummary.deliveryFee : deliveryFee)}
                    </span>
                  </div>
                  {(orderSummary ? orderSummary.discount : discount) > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Desconto</span>
                      <span>-{formatBRL(orderSummary ? orderSummary.discount : discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-amber-400 pt-2 border-t border-slate-800">
                    <span>Total a Pagar</span>
                    <span>{formatBRL(orderSummary ? orderSummary.total : total)}</span>
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
