'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Flame, Sparkles, TrendingUp, ChevronRight } from 'lucide-react';
import { Product } from '../types';
import { REAL_TAILANDIA_PRODUCTS, getFeaturedProducts } from '../services/products';
import ProductCard from './ProductCard';
import { applyStockUpdateToProducts, StockUpdateEvent } from '../hooks/useRealtimeStock';

export default function FeaturedSection() {
  const [products, setProducts] = useState<Product[]>(() => getFeaturedProducts(REAL_TAILANDIA_PRODUCTS));

  useEffect(() => {
    let isMounted = true;
    async function loadFeatured() {
      try {
        const res = await fetch('/api/products?destaque=true');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setProducts(getFeaturedProducts(data));
          }
        }
      } catch {
        // Fallback seguro
      }
    }
    loadFeatured();
    return () => { isMounted = false; };
  }, []);

  // Escuta atualizações de estoque em tempo real
  useEffect(() => {
    const handleStockUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<StockUpdateEvent>;
      if (customEvent.detail) {
        setProducts(prev => applyStockUpdateToProducts(prev, customEvent.detail));
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('tailandia:stock_updated', handleStockUpdate);
      return () => window.removeEventListener('tailandia:stock_updated', handleStockUpdate);
    }
  }, []);

  const featuredList = useMemo(() => {
    return products.slice(0, 8);
  }, [products]);

  if (featuredList.length === 0) return null;

  return (
    <section className="py-6 sm:py-8" id="mais-vendidos">
      {/* Cabeçalho da Seção */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 shadow-lg shadow-amber-500/25">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                Alta Demanda
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">• Atualizado em tempo real</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Mais Vendidos & Destaques Comerciais
            </h2>
          </div>
        </div>
      </div>

      {/* Grid de Destaques Comerciais */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {featuredList.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
