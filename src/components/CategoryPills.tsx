'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  Flame,
  Beer,
  Wine,
  Cigarette,
  Snowflake,
  Utensils,
  Cookie,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { CATEGORIES_LIST } from '../services/products';

export default function CategoryPills() {
  const pathname = usePathname();
  const { setActiveCategory } = useCart();

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles': return <Sparkles size={16} />;
      case 'Flame': return <Flame size={16} />;
      case 'Beer': return <Beer size={16} />;
      case 'Wine': return <Wine size={16} />;
      case 'Cigarette': return <Cigarette size={16} />;
      case 'Snowflake': return <Snowflake size={16} />;
      case 'Utensils': return <Utensils size={16} />;
      case 'Cookie': return <Cookie size={16} />;
      default: return <Sparkles size={16} />;
    }
  };

  return (
    <div className="w-full border-b border-[#00E5FF]/20 bg-[#050B14]/85 py-3.5 backdrop-blur-md sticky top-[73px] z-30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES_LIST.map((cat) => {
            const href = cat.slug ? `/categoria/${cat.slug}` : '/';
            const isActive = cat.slug
              ? pathname.startsWith(`/categoria/${cat.slug}`)
              : pathname === '/';

            return (
              <Link
                key={cat.id}
                href={href}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#00E5FF] text-[#050B14] shadow-[0_0_15px_rgba(0,229,255,0.55)] scale-105'
                    : 'bg-[#0A192F]/80 text-[#A0AAB2] border border-[#00E5FF]/25 hover:border-[#00E5FF] hover:text-white hover:bg-[#0A192F]'
                }`}
              >
                <span className={isActive ? 'text-[#050B14]' : 'text-[#00E5FF]'}>
                  {getIcon(cat.icon)}
                </span>
                <span>{cat.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
