'use client';

import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { formatBRL, generateWhatsAppLink } from '../services/cart';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Bike, 
  Store, 
  Tag, 
  MessageSquare, 
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

import { useRouter } from 'next/navigation';

export default function CartDrawer() {
  const router = useRouter();
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeItem,
    clearCart,
    deliveryType,
    setDeliveryType,
    customerName,
    setCustomerName,
    couponCode,
    discount,
    applyCoupon,
    removeCoupon,
    subtotal,
    deliveryFee,
    total,
    selectedLocation,
    setIsLocationModalOpen
  } = useCart();

  const [inputCoupon, setInputCoupon] = useState('');
  const [couponError, setCouponError] = useState('');

  if (!isCartOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    const res = applyCoupon(inputCoupon);
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setInputCoupon('');
    }
  };

  const handleWhatsAppCheckout = () => {
    if (items.length === 0) return;
    const url = generateWhatsAppLink(
      items,
      deliveryType,
      selectedLocation,
      couponCode || undefined,
      discount,
      deliveryFee,
      total,
      customerName || undefined
    );
    window.open(url, '_blank');
  };

  const FREE_SHIPPING_THRESHOLD = 150;
  const valueToFreeShipping = FREE_SHIPPING_THRESHOLD - subtotal;
  const progressPercentage = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  const handleWebCheckout = () => {
    setIsCartOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tailandia_delivery_type', deliveryType);
      localStorage.setItem('tailandia_customer_name', customerName);
    }
    router.push('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-l border-slate-800 text-slate-100 flex flex-col shadow-2xl">
          
          {/* Header do Drawer */}
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/60">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Seu Carrinho</h2>
                <p className="text-xs text-slate-400">
                  {items.length === 0 ? 'Carrinho vazio' : `${items.length} ${items.length === 1 ? 'item' : 'itens'}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              aria-label="Fechar carrinho"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Seletor de Tipo de Entrega */}
          <div className="p-4 bg-slate-950/40 border-b border-slate-800">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-800/60 p-1 border border-slate-700/60">
              <button
                type="button"
                onClick={() => setDeliveryType('DELIVERY')}
                className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition ${
                  deliveryType === 'DELIVERY'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bike className="h-4 w-4" />
                Entrega Delivery
              </button>
              <button
                type="button"
                onClick={() => setDeliveryType('RETIRADA')}
                className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition ${
                  deliveryType === 'RETIRADA'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Store className="h-4 w-4" />
                Retirar na Loja
              </button>
            </div>

            {deliveryType === 'DELIVERY' && (
              <div className="mt-2.5 flex items-center justify-between text-xs px-1 text-slate-300">
                <span className="truncate max-w-[240px]">📍 {selectedLocation}</span>
                <button
                  onClick={() => setIsLocationModalOpen(true)}
                  className="text-amber-400 hover:text-amber-300 underline font-medium"
                >
                  Alterar
                </button>
              </div>
            )}
          </div>

          {/* Barra de Progresso - Frete Grátis */}
          {deliveryType === 'DELIVERY' && items.length > 0 && (
            <div className="px-6 py-3 bg-slate-900/80 border-b border-slate-800">
              <div className="flex justify-between text-[11px] mb-1.5 font-medium">
                {valueToFreeShipping > 0 ? (
                  <span className="text-slate-300">
                    Faltam <span className="text-amber-400 font-bold">{formatBRL(valueToFreeShipping)}</span> para entrega grátis!
                  </span>
                ) : (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    🎉 Você ganhou entrega grátis!
                  </span>
                )}
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ease-out ${valueToFreeShipping <= 0 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Lista de Itens do Carrinho */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 custom-scrollbar">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="h-16 w-16 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500 mb-4">
                  <ShoppingBag className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Seu carrinho está vazio</h3>
                <p className="text-xs text-slate-400 max-w-xs mb-6">
                  Adicione bebidas trincando de geladas, combos exclusivos e itens de tabacaria ao seu pedido.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-5 py-2.5 text-xs font-bold text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition"
                >
                  Explorar Catálogo
                </button>
              </div>
            ) : (
              items.map((item) => {
                const hasPromo = !!item.product.preco_promocional && item.product.preco_promocional < item.product.preco_venda;
                const unitPrice = hasPromo ? item.product.preco_promocional! : item.product.preco_venda;
                const itemTotal = unitPrice * item.quantity;

                return (
                  <div
                    key={item.product.id}
                    className="flex gap-3 rounded-xl border border-slate-800 bg-slate-800/40 p-3 hover:border-slate-700 transition"
                  >
                    {/* Imagem do Item */}
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-slate-950/80 p-1 border border-slate-800 flex items-center justify-center">
                      <img
                        src={item.product.imagem_url}
                        alt={item.product.nome}
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=200&auto=format&fit=crop&q=80';
                        }}
                      />
                    </div>

                    {/* Dados do Item */}
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-semibold text-white line-clamp-1">
                            {item.product.nome}
                          </h4>
                          <button
                            onClick={() => removeItem(item.product.id)}
                            className="text-slate-500 hover:text-rose-400 transition"
                            title="Remover item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {formatBRL(unitPrice)} un.
                        </div>
                      </div>

                      {/* Controles de Quantidade e Subtotal */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center rounded-lg border border-slate-700 bg-slate-900 px-1 py-0.5">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="rounded p-1 text-slate-400 hover:text-white transition"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            disabled={item.quantity >= item.product.estoque_atual}
                            className="rounded p-1 text-slate-400 hover:text-white disabled:opacity-30 transition"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <span className="text-xs font-bold text-amber-400">
                          {formatBRL(itemTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Seção Inferior: Cupom, Totais e Botões de Checkout */}
          {items.length > 0 && (
            <div className="border-t border-slate-800 bg-slate-950/80 p-5 space-y-4">
              
              {/* Campo de Cupom */}
              <div>
                {couponCode ? (
                  <div className="flex items-center justify-between rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 px-3 py-2 text-xs text-[#00E5FF]">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Tag className="h-3.5 w-3.5" /> Cupom {couponCode} aplicado (-{formatBRL(discount)})
                    </span>
                    <button
                      onClick={removeCoupon}
                      className="text-[#FF3366] hover:underline font-bold cursor-pointer"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Cupom (ex: TAI10)"
                      value={inputCoupon}
                      onChange={(e) => setInputCoupon(e.target.value)}
                      className="flex-1 rounded-full border border-white/10 bg-[#050B14] px-4 py-2 text-xs text-white placeholder-[#A0AAB2] focus:border-[#00E5FF] focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="tai-btn-outline !py-2 !px-4 text-xs font-bold"
                    >
                      Aplicar
                    </button>
                  </form>
                )}
                {couponError && (
                  <p className="mt-1 text-[11px] text-[#FF3366] flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {couponError}
                  </p>
                )}
              </div>

              {/* Nome do Cliente (Opcional para agilizar o WhatsApp) */}
              <div>
                <input
                  type="text"
                  placeholder="Seu Nome (opcional)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full rounded-full border border-white/10 bg-[#050B14] px-4 py-2 text-xs text-white placeholder-[#A0AAB2] focus:border-[#00E5FF] focus:outline-none"
                />
              </div>

              {/* Resumo Financeiro */}
              <div className="space-y-1.5 text-xs text-[#A0AAB2] border-t border-white/10 pt-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-white font-medium">{formatBRL(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-[#00FF88] font-medium">
                    <span>Desconto</span>
                    <span>-{formatBRL(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Taxa de Entrega</span>
                  <span className="text-white font-medium">
                    {deliveryType === 'RETIRADA'
                      ? 'Grátis (Retirada)'
                      : deliveryFee === 0
                      ? 'Grátis (Pedido > R$150)'
                      : formatBRL(deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/10 text-sm font-black text-white">
                  <span>Total</span>
                  <span className="text-lg font-display text-[#00E5FF] neon-text">{formatBRL(total)}</span>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="space-y-2.5 pt-1">
                {/* Botão Pedir via WhatsApp */}
                <button
                  onClick={handleWhatsAppCheckout}
                  className="tai-btn-primary w-full !py-3.5 text-sm uppercase tracking-wider font-extrabold"
                >
                  <MessageSquare className="h-4 w-4" />
                  Pedir Rápido pelo WhatsApp
                </button>

                {/* Botão Finalizar Pedido Web */}
                <button
                  onClick={handleWebCheckout}
                  className="tai-btn-outline w-full !py-2.5 text-xs font-bold"
                >
                  <span>Finalizar no Site (Pix Automático)</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#00E5FF]" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#A0AAB2] pt-1">
                <ShieldCheck className="h-3.5 w-3.5 text-[#00FF88]" />
                Compra 100% Segura • Entrega Rápida 24 Horas
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
