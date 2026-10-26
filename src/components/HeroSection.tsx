'use client';

import React from 'react';
import { Truck, Snowflake, Flame, ShieldCheck, ArrowRight, PhoneCall } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function HeroSection() {
  const { setActiveCategory } = useCart();

  const scrollToVitrine = () => {
    const el = document.getElementById('vitrine') || document.getElementById('mais-vendidos');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative mx-auto max-w-7xl px-4 pt-6 pb-8 sm:px-6 lg:px-8">
      {/* Container Principal do Hero */}
      <div className="tai-card relative overflow-hidden !p-6 sm:!p-10 lg:!p-12 border-[#00E5FF]/30 shadow-[0_10px_40px_rgba(0,0,0,0.7)] bg-[#0A192F]/80">
        
        {/* Glows de Fundo Neon */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#00E5FF]/10 blur-[110px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-72 h-72 bg-[#00E5FF]/5 blur-[90px] rounded-full pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Coluna Esquerda: Textos de Alto Impacto & Conversão */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Badge Flor de Lótus Neon */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#050B14] border border-[#00E5FF]/40 text-xs font-semibold text-[#00E5FF] shadow-[0_0_14px_rgba(0,229,255,0.25)]">
              <svg className="w-4 h-4 fill-current text-[#00E5FF]" viewBox="0 0 24 24">
                <path d="M12 3C10 6 9 9 9 12C9 15 12 18 12 18C12 18 15 15 15 12C15 9 14 6 12 3ZM6 8C4.5 10.5 4.5 13.5 6 16C7.5 17.5 10.5 18 12 18C10 15.5 8.5 12 6 8ZM18 8C15.5 12 14 15.5 12 18C13.5 18 16.5 17.5 18 16C19.5 13.5 19.5 10.5 18 8Z"/>
              </svg>
              <span>Delivery Oficial • Taguatinga & Brasília</span>
            </div>

            {/* Título de Conversão */}
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl xl:text-6xl text-white tracking-tight leading-[1.06]">
              GELADO EM <span className="neon-text text-[#00E5FF]">MINUTOS</span>
            </h1>

            {/* Subtítulo */}
            <p className="text-[#A0AAB2] text-base sm:text-lg max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Os melhores combos de whisky, gin trincando de gelados e artigos completos de tabacaria com entrega expressa 24h em Brasília e Taguatinga.
            </p>

            {/* Ações / CTAs */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <button
                onClick={scrollToVitrine}
                className="tai-btn-primary text-sm sm:text-base !px-8 !py-3.5 cursor-pointer"
              >
                <span>Ver produtos</span>
                <ArrowRight size={18} />
              </button>

              <a
                href="https://wa.me/5561999999999?text=Ol%C3%A1%2C%20gostaria%20de%20fazer%20um%20pedido%20pelo%20WhatsApp!"
                target="_blank"
                rel="noopener noreferrer"
                className="tai-btn-outline text-xs sm:text-sm !py-3 !px-5"
              >
                <PhoneCall size={16} className="text-[#00E5FF]" />
                <span>Pedir no WhatsApp</span>
              </a>

              <div className="w-full flex items-center justify-center lg:justify-start gap-2 text-xs text-[#A0AAB2] pt-1">
                {/* Ícone Folha de Tabaco Ciano */}
                <svg className="w-4 h-4 text-[#00E5FF] neon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
                  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
                </svg>
                <span>Bebidas no ponto &amp; Tabacaria Premium</span>
              </div>
            </div>

          </div>

          {/* Coluna Direita: Arte Oficial dos Elefantes Tailandeses + Narguilé Neon */}
          <div className="lg:col-span-5 flex justify-center relative select-none">
            
            {/* Halo de Luz Neon */}
            <div className="absolute inset-0 bg-[#00E5FF]/20 blur-[80px] rounded-full pointer-events-none" />

            <div className="relative z-10 w-full max-w-[460px] flex flex-col items-center">
              
              {/* Logo Oficial da Marca em Destaque */}
              <div className="relative p-3 rounded-3xl bg-[#050B14]/70 border border-[#00E5FF]/30 shadow-[0_0_25px_rgba(0,229,255,0.25)] backdrop-blur-md mb-4 transition-transform hover:scale-105 duration-300">
                <img
                  src="/imagens/tai logo canvas color.png"
                  alt="Tailândia Bebidas & Tabacaria"
                  className="w-full h-auto max-h-[220px] object-contain rounded-2xl"
                  onError={(e) => {
                    // Fallback se a imagem demorar
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>

              {/* Arte Vetorial dos Elefantes Neon Tailandeses */}
              <svg className="w-full h-auto animate-neon max-h-[140px]" viewBox="0 0 680 240" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <filter id="cyanGlowHero" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Elefante Esquerdo */}
                <g filter="url(#cyanGlowHero)" stroke="var(--primary-color)" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M35 185 C22 155, 32 105, 65 75 C95 52, 155 48, 195 68 C210 48, 255 42, 275 68 C295 82, 305 108, 305 132 C305 155, 292 178, 278 178 C268 178, 266 162, 274 155 C282 148, 282 135, 272 128 C258 125, 245 112, 238 98 L252 205 L215 205 L208 142 C180 148, 145 148, 118 138 L108 205 L70 205 L78 135 C58 145, 48 165, 35 185 Z" strokeWidth="2.8" fill="rgba(0, 229, 255, 0.04)"/>
                  <path d="M268 115 C292 128, 312 125, 324 116 C312 134, 288 138, 264 126" strokeWidth="2" fill="rgba(0, 229, 255, 0.15)"/>
                  <path d="M188 66 C162 72, 152 105, 175 122 C195 130, 225 125, 232 105" strokeWidth="2"/>
                  <circle cx="256" cy="88" r="3.5" fill="var(--primary-color)"/>
                </g>

                {/* Narguilé Central */}
                <g filter="url(#cyanGlowHero)" stroke="var(--primary-color)" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M340 105 L340 175 M326 115 L354 115 M322 205 C322 182, 358 182, 358 205 Z" strokeWidth="2" fill="rgba(0, 229, 255, 0.08)"/>
                  <path d="M348 160 C372 155, 378 185, 352 195" strokeWidth="1.6"/>
                  <path d="M340 75 C332 88, 332 98, 340 105 C348 98, 348 88, 340 75 Z" strokeWidth="1.8" fill="rgba(0, 229, 255, 0.2)"/>
                </g>

                {/* Elefante Direito */}
                <g transform="translate(680, 0) scale(-1, 1)" filter="url(#cyanGlowHero)" stroke="var(--primary-color)" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M35 185 C22 155, 32 105, 65 75 C95 52, 155 48, 195 68 C210 48, 255 42, 275 68 C295 82, 305 108, 305 132 C305 155, 292 178, 278 178 C268 178, 266 162, 274 155 C282 148, 282 135, 272 128 C258 125, 245 112, 238 98 L252 205 L215 205 L208 142 C180 148, 145 148, 118 138 L108 205 L70 205 L78 135 C58 145, 48 165, 35 185 Z" strokeWidth="2.8" fill="rgba(0, 229, 255, 0.04)"/>
                  <path d="M268 115 C292 128, 312 125, 324 116 C312 134, 288 138, 264 126" strokeWidth="2" fill="rgba(0, 229, 255, 0.15)"/>
                  <path d="M188 66 C162 72, 152 105, 175 122 C195 130, 225 125, 232 105" strokeWidth="2"/>
                  <circle cx="256" cy="88" r="3.5" fill="var(--primary-color)"/>
                </g>
              </svg>

            </div>

          </div>

        </div>

      </div>

      {/* Grid de 4 Benefícios em Glassmorphism */}
      <div className="mt-5 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        
        <div className="tai-card tai-card-interactive !p-3.5 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF]">
            <Truck size={20} />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Entrega Expressa</div>
            <div className="text-[11px] text-[#A0AAB2]">35 min em Taguatinga</div>
          </div>
        </div>

        <div className="tai-card tai-card-interactive !p-3.5 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF]">
            <Snowflake size={20} />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Trincando de Gelada</div>
            <div className="text-[11px] text-[#A0AAB2]">No ponto de beber</div>
          </div>
        </div>

        <div className="tai-card tai-card-interactive !p-3.5 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF]">
            <Flame size={20} />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Preço de Atacado</div>
            <div className="text-[11px] text-[#A0AAB2]">Direto da distribuidora</div>
          </div>
        </div>

        <div className="tai-card tai-card-interactive !p-3.5 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF]">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="text-xs font-bold text-white">100% Confiável</div>
            <div className="text-[11px] text-[#A0AAB2]">Loja física &amp; online</div>
          </div>
        </div>

      </div>
    </section>
  );
}
