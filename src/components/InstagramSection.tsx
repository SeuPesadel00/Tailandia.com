'use client';

import React from 'react';
import { Instagram, ExternalLink, Heart, MessageCircle } from 'lucide-react';

const INSTAGRAM_POSTS = [
  {
    id: 1,
    image: '/imagens/modelo tailandia.jpeg',
    title: 'Ambiente e vibe Tailândia Distribuidora!',
    likes: '842',
    comments: '46',
    tag: '#VibeTailandia',
  },
  {
    id: 2,
    image: '/imagens/narguile 1.jpeg',
    title: 'Setups completos de narguile montados na hora',
    likes: '915',
    comments: '63',
    tag: '#NarguileDF',
  },
  {
    id: 3,
    image: '/imagens/rosh varios.jpeg',
    title: 'Coleção exclusiva de roshs cerâmicos premium',
    likes: '674',
    comments: '39',
    tag: '#HeadshopDF',
  },
  {
    id: 4,
    image: '/imagens/dichavadores.jpeg',
    title: 'Acessórios, dichavadores e sedas selecionadas',
    likes: '588',
    comments: '31',
    tag: '#TabacariaDF',
  },
];

export default function InstagramSection() {
  return (
    <section className="py-12 border-t border-slate-800/80 bg-slate-950/40" id="instagram">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header da Seção */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Instagram className="h-4 w-4" />
              Siga no Instagram
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              @tailandia.<span className="text-amber-400">distribuidora</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Acompanhe novidades, bastidores das entregas e promoções relâmpago de fim de semana!
            </p>
          </div>

          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-500/20 hover:opacity-90 transition active:scale-95 self-start sm:self-auto"
          >
            <Instagram className="h-4 w-4" />
            <span>Seguir no Instagram</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Grid de Posts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {INSTAGRAM_POSTS.map((post) => (
            <a
              key={post.id}
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-md transition-all hover:border-pink-500/50 hover:shadow-pink-500/10"
            >
              <img
                src={post.image}
                alt={post.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />

              {/* Overlay Escuro com Likes e Texto no Hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-end">
                <span className="text-[11px] font-bold text-amber-400 mb-1">{post.tag}</span>
                <p className="text-xs font-semibold text-white line-clamp-2 mb-3">
                  {post.title}
                </p>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5 text-rose-400 fill-rose-400" />
                    {post.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3.5 w-3.5 text-slate-400" />
                    {post.comments}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>

      </div>
    </section>
  );
}
