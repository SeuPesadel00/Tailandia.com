'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Flame } from 'lucide-react';
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
    <section className="py-6 sm:py-8" id="vitrine">
      {/* Cabeçalho da Seção */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0A192F] border border-[#00E5FF]/40 text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.35)]">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-widest text-[#00E5FF] uppercase bg-[#00E5FF]/10 px-2.5 py-0.5 rounded-full border border-[#00E5FF]/30">
                Alta Demanda
              </span>
              <span className="text-xs text-[#A0AAB2] hidden sm:inline">• Bebidas trincando &amp; combos</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 font-display mt-0.5">
              Destaques da Semana
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
