'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, MapPin, Search, Instagram, PhoneCall, Sparkles, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatBRL } from '../services/cart';

export default function Header() {
  const {
    totalItemsCount,
    subtotal,
    setIsCartOpen,
    selectedLocation,
    setIsLocationModalOpen,
    searchQuery,
    setSearchQuery,
  } = useCart();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
      {/* Top Banner Informativo com scroll suave em telas menores */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-3 py-1 text-center text-[11px] sm:text-xs font-semibold text-white shadow-inner">
        <span className="inline-flex items-center gap-1.5 truncate max-w-full">
          <Sparkles size={12} className="shrink-0 text-amber-300" />
          <strong className="tracking-wide">ENTREGA 24H EM TAGUATINGA & CEILÂNDIA</strong>
          <span className="hidden sm:inline">• Bebidas trincando de geladas • Frete Grátis acima de R$ 150</span>
        </span>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-4 px-3 py-2.5 sm:px-6 lg:px-8">
        {/* LOGO RESPONSIVO */}
        <div className="flex items-center gap-2">
          <Link href="/" className="group flex items-center gap-2">
            <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-md shadow-emerald-500/20 transition-transform group-hover:scale-105">
              <span className="text-base sm:text-xl font-black tracking-tighter text-slate-950">TL</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-base sm:text-xl font-black tracking-wider text-white">TAILÂNDIA</span>
                <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[9px] sm:text-[10px] font-bold text-amber-400 border border-amber-500/30">
                  24H
                </span>
              </div>
              <span className="hidden sm:inline text-[10px] font-medium tracking-widest text-emerald-400 uppercase">
                Tabacaria & Bebidas
              </span>
            </div>
          </Link>
        </div>

        {/* SELETOR DE LOCALIZAÇÃO (DESKTOP) */}
        <button
          onClick={() => setIsLocationModalOpen(true)}
          className="hidden md:flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-left text-xs transition-colors hover:border-emerald-500/50 hover:bg-slate-900"
          title="Alterar local de entrega"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <MapPin size={13} />
          </div>
          <div>
            <div className="text-[9px] font-medium text-slate-400">Entregar em:</div>
            <div className="max-w-[130px] truncate font-semibold text-slate-200 lg:max-w-[180px]">
              {selectedLocation}
            </div>
          </div>
        </button>

        {/* BARRA DE PESQUISA GLOBAL (DESKTOP) */}
        <div className="relative hidden sm:block flex-1 max-w-md mx-2">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar whisky, cerveja, essência, combos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-8 text-xs text-white placeholder-slate-400 transition-all focus:border-emerald-500 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* LINKS E BOTÃO DE CARRINHO */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Botão de Região em Mobile */}
          <button
            onClick={() => setIsLocationModalOpen(true)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-emerald-400 hover:bg-slate-900 transition"
            title="Localização"
          >
            <MapPin size={15} />
          </button>

          {/* Instagram */}
          <a
            href="https://www.instagram.com/tailandia.online/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-slate-400 transition-colors hover:border-pink-500/40 hover:text-pink-400"
            title="Siga a Tailândia no Instagram"
          >
            <Instagram size={15} />
          </a>

          {/* WhatsApp Direto */}
          <a
            href="https://wa.me/5561999999999?text=Ol%C3%A1%2C%20gostaria%20de%20fazer%20um%20pedido%20pelo%20WhatsApp!"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20"
          >
            <PhoneCall size={13} />
            <span>WhatsApp</span>
          </a>

          {/* BOTÃO DO CARRINHO (RESPONSIVO E DESTACADO) */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-2 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 transition-all hover:brightness-110 active:scale-95"
            aria-label="Abrir carrinho"
          >
            <ShoppingBag size={16} />
            <span className="hidden sm:inline">
              {mounted && subtotal > 0 ? formatBRL(subtotal) : 'Carrinho'}
            </span>
            {mounted && totalItemsCount > 0 && (
              <span className="flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-slate-950 text-[9px] sm:text-[10px] font-black text-emerald-400 shadow-md">
                {totalItemsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* BARRA DE PESQUISA MOBILE (VISÍVEL APENAS EM TELAS PEQUENAS) */}
      <div className="sm:hidden px-3 pb-2.5">
        <div className="relative w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar bebidas, tabacaria, combos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2 pl-8 pr-7 text-xs text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
