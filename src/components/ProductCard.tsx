'use client';

import React from 'react';
import { Plus, Minus, ShoppingBag, Eye, Snowflake, Flame, Tag } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { formatBRL } from '../services/cart';

export default function ProductCard({ product }: { product: Product }) {
  const { items, addItem, updateQuantity, setQuickViewProduct } = useCart();

  const cartItem = items.find((i) => i.product.id === product.id);
  const inCartQty = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = product.estoque_atual <= 0;

  const getSeloBadge = () => {
    if (isOutOfStock) {
      return (
        <span className="flex items-center gap-1 rounded-full bg-[#050B14]/90 px-2.5 py-0.5 text-[10px] font-bold text-[#FF3366] border border-[#FF3366]/40">
          Esgotado
        </span>
      );
    }
    if (product.selo_especial === 'Gelada') {
      return (
        <span className="flex items-center gap-1 rounded-full bg-[#00E5FF]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#00E5FF] border border-[#00E5FF]/50 shadow-[0_0_10px_rgba(0,229,255,0.25)]">
          <Snowflake size={11} /> Gelada
        </span>
      );
    }
    if (product.selo_especial === 'Mais Vendido') {
      return (
        <span className="flex items-center gap-1 rounded-full bg-[#00FF88]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#00FF88] border border-[#00FF88]/50 shadow-[0_0_10px_rgba(0,255,136,0.25)]">
          <Flame size={11} /> Mais Vendido
        </span>
      );
    }
    if (product.preco_promocional || product.selo_especial === 'Promoção') {
      return (
        <span className="flex items-center gap-1 rounded-full bg-[#FFD600]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#FFD600] border border-[#FFD600]/50 shadow-[0_0_10px_rgba(255,214,0,0.25)]">
          <Tag size={11} /> Oferta
        </span>
      );
    }
    if (product.categoria === 'Combos') {
      return (
        <span className="flex items-center gap-1 rounded-full bg-[#BD00FF]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#BD00FF] border border-[#BD00FF]/50">
          Combo
        </span>
      );
    }
    return null;
  };

  const precoFinal = product.preco_promocional || product.preco_venda;

  return (
    <div className="tai-card tai-card-interactive group relative flex flex-col justify-between !p-4 border-[#00E5FF]/20 bg-[#0A192F]/80">
      <div>
        {/* Container da Imagem com Botão de Visualização Rápida */}
        <div className="relative mb-3 flex h-44 w-full items-center justify-center overflow-hidden rounded-xl bg-[#050B14]/80 p-2 border border-white/5">
          {/* Selos / Badges */}
          <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
            {getSeloBadge()}
          </div>

          {/* Botão Quick View */}
          <button
            onClick={() => setQuickViewProduct(product)}
            className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-lg bg-[#0A192F]/90 text-[#A0AAB2] opacity-90 sm:opacity-0 sm:group-hover:opacity-100 backdrop-blur-md border border-[#00E5FF]/30 transition-all hover:bg-[#00E5FF] hover:text-[#050B14] active:scale-95"
            title="Ver detalhes"
          >
            <Eye size={14} />
          </button>

          {/* Imagem do Produto */}
          {product.imagem_url ? (
            <img
              src={product.imagem_url}
              alt={product.nome}
              className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[#A0AAB2]">
              {product.nome.slice(0, 3).toUpperCase()}
            </div>
          )}
        </div>

        {/* Categoria & Volume */}
        <div className="mb-1 flex items-center justify-between text-[11px] text-[#A0AAB2]">
          <span className="font-semibold text-[#00E5FF]">{product.categoria}</span>
          {product.volume && <span>{product.volume}</span>}
        </div>

        {/* Título */}
        <h3
          onClick={() => setQuickViewProduct(product)}
          className="line-clamp-2 cursor-pointer text-xs font-bold text-white transition-colors hover:text-[#00E5FF] sm:text-sm font-display leading-tight"
        >
          {product.nome}
        </h3>
      </div>

      {/* Preço & Controles de Compra */}
      <div className="mt-3 pt-2.5 border-t border-white/10">
        <div className="mb-2 flex items-baseline gap-1.5">
          <span className="font-display font-extrabold text-lg sm:text-xl text-[#00E5FF] neon-text">
            {formatBRL(precoFinal)}
          </span>
          {product.preco_promocional && product.preco_promocional < product.preco_venda && (
            <span className="text-[11px] text-[#A0AAB2] line-through">
              {formatBRL(product.preco_venda)}
            </span>
          )}
        </div>

        {/* Ações de Carrinho */}
        {isOutOfStock ? (
          <button
            disabled
            className="w-full rounded-full border border-white/10 bg-[#050B14]/60 py-2.5 text-center text-xs font-semibold text-[#A0AAB2] cursor-not-allowed"
          >
            Indisponível
          </button>
        ) : inCartQty > 0 ? (
          <div className="flex items-center justify-between rounded-full border border-[#00E5FF]/40 bg-[#00E5FF]/15 px-2 py-1 text-xs text-[#00E5FF]">
            <button
              onClick={() => updateQuantity(product.id, -1)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#050B14] text-white transition-colors hover:bg-[#FF3366] active:scale-90"
              aria-label="Diminuir"
            >
              <Minus size={13} />
            </button>
            <span className="font-bold text-white text-xs">{inCartQty}</span>
            <button
              onClick={() => updateQuantity(product.id, 1)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00E5FF] text-[#050B14] font-bold transition-colors hover:brightness-110 active:scale-90"
              aria-label="Aumentar"
            >
              <Plus size={13} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => addItem(product, 1)}
            className="tai-btn-outline w-full !py-2.5 !px-3 text-xs font-bold !rounded-full"
          >
            <ShoppingBag size={14} />
            <span>Adicionar</span>
          </button>
        )}
      </div>
    </div>
  );
}
