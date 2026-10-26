'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sparkles,
  Flame,
  Beer,
  Wine,
  Cigarette,
  Snowflake,
  Utensils,
  Cookie,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronRight,
  PackageOpen,
  X,
  Home
} from 'lucide-react';
import { Product } from '../types';
import { getCategoryBySlug, REAL_TAILANDIA_PRODUCTS, filterVendaveis } from '../services/products';
import ProductCard from './ProductCard';
import { applyStockUpdateToProducts, StockUpdateEvent } from '../hooks/useRealtimeStock';

interface CategoryCatalogViewProps {
  categorySlug: string;
}

function CategoryCatalogContent({ categorySlug }: CategoryCatalogViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedSubcategory = searchParams.get('sub') || 'TODAS';
  const sortBy = (searchParams.get('ordem') as any) || 'destaque';
  const selectedPriceRange = searchParams.get('preco') || 'TODOS';
  const searchQuery = searchParams.get('q') || '';

  const categoryMeta = useMemo(() => getCategoryBySlug(categorySlug), [categorySlug]);

  const [products, setProducts] = useState<Product[]>(() => {
    const targetCats = (categoryMeta.dbCategories || [categoryMeta.id]).map(c => c.toLowerCase());
    return filterVendaveis(REAL_TAILANDIA_PRODUCTS).filter(p =>
      targetCats.includes((p.categoria || '').toLowerCase())
    );
  });

  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState<number>(20);

  // Busca do backend com filtro de categoria
  useEffect(() => {
    let isMounted = true;
    async function loadCategoryProducts() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/products?slug=${encodeURIComponent(categorySlug)}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data)) {
            setProducts(data);
          }
        }
      } catch (err) {
        console.error('Falha ao carregar categoria:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadCategoryProducts();
    return () => { isMounted = false; };
  }, [categorySlug]);

  // Escuta estoque em tempo real (PDV / Supabase Realtime)
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

  // Extrai todas as subcategorias existentes nos produtos desta categoria
  const availableSubcategories = useMemo(() => {
    const subs = new Set<string>();
    // Prioriza as sugeridas
    (categoryMeta.subcategoriasSugeridas || []).forEach(s => subs.add(s));

    products.forEach(p => {
      if (p.subcategoria && p.subcategoria.trim()) {
        subs.add(p.subcategoria.trim());
      }
    });
    return Array.from(subs);
  }, [products, categoryMeta]);

  // Atualiza query params de forma limpa sem quebrar abas independentes
  const updateQueryParam = (key: string, value: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (!value || value === 'TODAS' || value === 'TODOS' || value === 'destaque') {
      current.delete(key);
    } else {
      current.set(key, value);
    }
    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.replace(`/categoria/${categorySlug}${query}`, { scroll: false });
  };

  // Filtragem e ordenação
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Subcategoria
    if (selectedSubcategory !== 'TODAS') {
      result = result.filter(p =>
        (p.subcategoria || '').toLowerCase() === selectedSubcategory.toLowerCase()
      );
    }

    // Busca textual local
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(p =>
        p.nome.toLowerCase().includes(q) ||
        p.descricao?.toLowerCase().includes(q) ||
        p.ean?.toLowerCase().includes(q)
      );
    }

    // Faixa de preço
    if (selectedPriceRange === 'ate25') {
      result = result.filter(p => (p.preco_promocional || p.preco_venda) <= 25);
    } else if (selectedPriceRange === '25a60') {
      result = result.filter(p => {
        const val = p.preco_promocional || p.preco_venda;
        return val > 25 && val <= 60;
      });
    } else if (selectedPriceRange === '60a120') {
      result = result.filter(p => {
        const val = p.preco_promocional || p.preco_venda;
        return val > 60 && val <= 120;
      });
    } else if (selectedPriceRange === '120mais') {
      result = result.filter(p => (p.preco_promocional || p.preco_venda) > 120);
    }

    // Ordenação
    if (sortBy === 'menor-preco') {
      result.sort((a, b) => (a.preco_promocional || a.preco_venda) - (b.preco_promocional || b.preco_venda));
    } else if (sortBy === 'maior-preco') {
      result.sort((a, b) => (b.preco_promocional || b.preco_venda) - (a.preco_promocional || a.preco_venda));
    } else if (sortBy === 'alfabetica') {
      result.sort((a, b) => a.nome.localeCompare(b.nome));
    } else {
      // Destaque comercial
      result.sort((a, b) => {
        const scoreA = (a.destaque_home ? 2 : 0) + (a.selo_especial ? 1 : 0);
        const scoreB = (b.destaque_home ? 2 : 0) + (b.selo_especial ? 1 : 0);
        return scoreB - scoreA;
      });
    }

    return result;
  }, [products, selectedSubcategory, searchQuery, selectedPriceRange, sortBy]);

  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Cigarette': return <Cigarette className="h-6 w-6" />;
      case 'Beer': return <Beer className="h-6 w-6" />;
      case 'Wine': return <Wine className="h-6 w-6" />;
      case 'Flame': return <Flame className="h-6 w-6" />;
      case 'Snowflake': return <Snowflake className="h-6 w-6" />;
      case 'Utensils': return <Utensils className="h-6 w-6" />;
      case 'Cookie': return <Cookie className="h-6 w-6" />;
      default: return <Sparkles className="h-6 w-6" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb navegável */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#A0AAB2]">
        <Link href="/" className="flex items-center gap-1 hover:text-[#00E5FF] transition">
          <Home size={13} />
          <span>Início</span>
        </Link>
        <ChevronRight size={12} className="text-white/30" />
        <span className="font-semibold text-white">{categoryMeta.label}</span>
        {selectedSubcategory !== 'TODAS' && (
          <>
            <ChevronRight size={12} className="text-white/30" />
            <span className="text-[#00E5FF] font-medium">{selectedSubcategory}</span>
          </>
        )}
      </nav>

      {/* Hero Banner Temático da Categoria */}
      <div className="tai-card relative overflow-hidden !p-6 sm:!p-8 border-[#00E5FF]/30 bg-[#0A192F]/85 shadow-[0_10px_35px_rgba(0,0,0,0.6)]">
        <div className="absolute top-0 right-10 w-64 h-64 bg-[#00E5FF]/10 blur-[90px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-xl border border-[#00E5FF]/30 bg-[#050B14]/80 text-[#00E5FF]"
            >
              {getCategoryIcon(categoryMeta.icon)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#00E5FF] bg-[#00E5FF]/10 px-2.5 py-0.5 rounded-full border border-[#00E5FF]/30">
                  Categoria Oficial
                </span>
                <span className="text-xs text-[#A0AAB2]">
                  {filteredProducts.length} itens disponíveis
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight mt-1">
                {categoryMeta.label}
              </h1>
              <p className="text-xs sm:text-sm text-[#A0AAB2] max-w-2xl mt-1">
                {categoryMeta.descricao}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Subcategorias (Chips Horizontais) */}
      {availableSubcategories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => updateQueryParam('sub', 'TODAS')}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${
              selectedSubcategory === 'TODAS'
                ? 'bg-[#00E5FF] text-[#050B14] shadow-[0_0_12px_rgba(0,229,255,0.45)]'
                : 'border border-[#00E5FF]/20 bg-[#0A192F]/80 text-[#A0AAB2] hover:border-[#00E5FF] hover:text-white'
            }`}
          >
            Todas as Subcategorias
          </button>
          {availableSubcategories.map((sub) => {
            const isSelected = selectedSubcategory.toLowerCase() === sub.toLowerCase();
            return (
              <button
                key={sub}
                onClick={() => updateQueryParam('sub', sub)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-[#00E5FF] text-[#050B14] shadow-[0_0_12px_rgba(0,229,255,0.45)]'
                    : 'border border-[#00E5FF]/20 bg-[#0A192F]/80 text-[#A0AAB2] hover:border-[#00E5FF] hover:text-white'
                }`}
              >
                {sub}
              </button>
            );
          })}
        </div>
      )}

      {/* Barra de Filtros e Ordenação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#00E5FF]/20 bg-[#0A192F]/80 p-3.5 backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs text-[#A0AAB2]">
          <span>Mostrando <strong>{displayedProducts.length}</strong> de <strong>{filteredProducts.length}</strong> produtos</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Ordenar por */}
          <div className="flex items-center gap-1.5 rounded-full border border-[#00E5FF]/30 bg-[#050B14]/80 px-3 py-1.5 text-xs text-[#A0AAB2]">
            <ArrowUpDown className="h-3.5 w-3.5 text-[#00E5FF]" />
            <select
              value={sortBy}
              onChange={(e) => updateQueryParam('ordem', e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer text-xs"
            >
              <option value="destaque" className="bg-[#0A192F] text-white">Mais Vendidos</option>
              <option value="menor-preco" className="bg-[#0A192F] text-white">Menor Preço</option>
              <option value="maior-preco" className="bg-[#0A192F] text-white">Maior Preço</option>
              <option value="alfabetica" className="bg-[#0A192F] text-white">Ordem Alfabética</option>
            </select>
          </div>

          {/* Faixa de Preço */}
          <div className="flex items-center gap-1.5 rounded-full border border-[#00E5FF]/30 bg-[#050B14]/80 px-3 py-1.5 text-xs text-[#A0AAB2]">
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#00E5FF]" />
            <select
              value={selectedPriceRange}
              onChange={(e) => updateQueryParam('preco', e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer text-xs"
            >
              <option value="TODOS" className="bg-[#0A192F] text-white">Todas as faixas</option>
              <option value="ate25" className="bg-[#0A192F] text-white">Até R$ 25</option>
              <option value="25a60" className="bg-[#0A192F] text-white">R$ 25 a R$ 60</option>
              <option value="60a120" className="bg-[#0A192F] text-white">R$ 60 a R$ 120</option>
              <option value="120mais" className="bg-[#0A192F] text-white">Acima de R$ 120</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid de Produtos */}
      {displayedProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {displayedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        /* Estado Vazio */
        <div className="tai-card flex flex-col items-center justify-center p-12 text-center border-dashed border-[#00E5FF]/30 bg-[#0A192F]/50">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00E5FF]/10 text-[#00E5FF] mb-4">
            <PackageOpen className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-white mb-1 font-display">Nenhum item encontrado nesta categoria</h3>
          <p className="text-xs text-[#A0AAB2] max-w-sm mb-5">
            Não encontramos produtos para os filtros selecionados. Tente selecionar outra subcategoria ou limpar os filtros.
          </p>
          <button
            onClick={() => {
              updateQueryParam('sub', 'TODAS');
              updateQueryParam('preco', 'TODOS');
            }}
            className="tai-btn-primary !px-5 !py-2.5 text-xs font-bold"
          >
            Limpar Filtros da Categoria
          </button>
        </div>
      )}

      {/* Botão Ver Mais */}
      {hasMore && (
        <div className="mt-8 flex justify-center pb-8">
          <button
            onClick={() => setVisibleCount((prev) => prev + 20)}
            className="tai-btn-outline !px-6 !py-3 text-xs font-bold"
          >
            Ver mais produtos ({filteredProducts.length - visibleCount} restantes)
          </button>
        </div>
      )}
    </div>
  );
}

export default function CategoryCatalogView({ categorySlug }: CategoryCatalogViewProps) {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-slate-400">Carregando catálogo da categoria...</div>}>
      <CategoryCatalogContent categorySlug={categorySlug} />
    </Suspense>
  );
}
