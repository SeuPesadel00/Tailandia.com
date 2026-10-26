'use client';

import React from 'react';
import { 
  MapPin, 
  Clock, 
  Phone, 
  Instagram, 
  MessageSquare, 
  ShieldAlert, 
  CreditCard, 
  ExternalLink,
  Flame
} from 'lucide-react';
import BrandMark from './BrandMark';

export default function Footer() {
  return (
    <footer className="border-t border-[#00E5FF]/20 bg-[#0A192F] text-[#A0AAB2] text-xs mt-12">
      
      {/* Faixa de Aviso Legal +18 */}
      <div className="bg-[#FF3366]/10 border-b border-[#FF3366]/30 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-[#FF3366] font-bold text-center text-xs">
          <ShieldAlert className="h-4 w-4 text-[#FF3366] shrink-0" />
          <span>
            PROIBIDA A VENDA E O CONSUMO DE BEBIDAS ALCOÓLICAS E PRODUTOS DE TABACARIA PARA MENORES DE 18 ANOS (LEI Nº 8.069/1990). SE BEBER, NÃO DIRIJA.
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Coluna 1: Sobre & Marca */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <BrandMark className="h-9 w-12" />
              <div>
                <span className="text-lg font-black tracking-widest text-white uppercase font-display block leading-none">
                  TAILÂNDIA
                </span>
                <span className="block text-[9px] tracking-[0.2em] text-[#00E5FF] font-bold mt-1 uppercase">
                  Bebidas &amp; Tabacaria
                </span>
              </div>
            </div>

            <p className="text-[#A0AAB2] leading-relaxed text-xs">
              A melhor e mais completa distribuidora de bebidas geladas, combos de destilados, tabacaria e narguilé de Brasília e Taguatinga. Entregas expressas na sua porta.
            </p>

            {/* Redes Sociais */}
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://www.instagram.com/tailandia.online/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#050B14] text-white hover:border-[#00E5FF] hover:text-[#00E5FF] transition"
                title="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://wa.me/5561999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#050B14] text-white hover:border-[#00E5FF] hover:text-[#00E5FF] transition"
                title="WhatsApp"
              >
                <MessageSquare className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Coluna 2: Horários de Funcionamento */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 font-display">
              <Clock className="h-4 w-4 text-[#00E5FF]" />
              Horário de Atendimento
            </h3>
            <ul className="space-y-2 text-xs">
              <li className="flex justify-between border-b border-white/5 pb-1.5">
                <span>Segunda a Quarta:</span>
                <span className="font-semibold text-white">10:00 às 02:00</span>
              </li>
              <li className="flex justify-between border-b border-white/5 pb-1.5">
                <span>Quinta-feira:</span>
                <span className="font-semibold text-white">10:00 às 04:00</span>
              </li>
              <li className="flex justify-between border-b border-white/5 pb-1.5 text-[#00E5FF] font-bold">
                <span>Sexta e Sábado:</span>
                <span>24 HORAS</span>
              </li>
              <li className="flex justify-between">
                <span>Domingo:</span>
                <span className="font-semibold text-white">10:00 às 02:00</span>
              </li>
            </ul>
            <div className="rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 p-2.5 text-[11px] text-[#00E5FF]">
              ⚡ Entregas expressas durante toda a madrugada no fim de semana!
            </div>
          </div>

          {/* Coluna 3: Localização & Atendimento */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 font-display">
              <MapPin className="h-4 w-4 text-[#00E5FF]" />
              Unidade &amp; Retirada
            </h3>
            <p className="text-xs leading-relaxed text-[#A0AAB2]">
              <strong className="text-white">Loja Matriz Taguatinga:</strong><br />
              Taguatinga Norte / Brasília - DF<br />
              CEP 72150-000
            </p>
            <a
              href="https://maps.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#00E5FF] hover:underline font-semibold"
            >
              <span>Ver no Google Maps</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            <div className="pt-2">
              <div className="text-[11px] text-[#A0AAB2] font-semibold uppercase">Central de Pedidos:</div>
              <a
                href="https://wa.me/5561999999999"
                className="text-sm font-black text-[#00E5FF] hover:brightness-110 flex items-center gap-1.5 mt-0.5 neon-text"
              >
                <Phone className="h-3.5 w-3.5" /> (61) 99999-9999
              </a>
            </div>
          </div>

          {/* Coluna 4: Formas de Pagamento & Segurança */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 font-display">
              <CreditCard className="h-4 w-4 text-[#00E5FF]" />
              Formas de Pagamento
            </h3>
            <p className="text-xs text-[#A0AAB2]">
              Pague com praticidade no momento da entrega ou retirada:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-white">
              <div className="rounded-xl bg-[#050B14] border border-white/10 p-2 text-center">
                ✨ PIX
              </div>
              <div className="rounded-xl bg-[#050B14] border border-white/10 p-2 text-center">
                💳 Cartão Crédito
              </div>
              <div className="rounded-xl bg-[#050B14] border border-white/10 p-2 text-center">
                💳 Cartão Débito
              </div>
              <div className="rounded-xl bg-[#050B14] border border-white/10 p-2 text-center">
                💵 Dinheiro
              </div>
            </div>
            <div className="pt-1 text-[11px] text-[#A0AAB2]">
              * Maquininha sem fio levada pelos nossos motoboys.
            </div>
          </div>

        </div>

        {/* Rodapé Inferior */}
        <div className="mt-12 border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#A0AAB2]">
          <div>
            © {new Date().getFullYear()} Tailândia Distribuidora &amp; Tabacaria. Todos os direitos reservados.
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-[#00E5FF]">Termos de Uso</a>
            <span>•</span>
            <a href="#" className="hover:text-[#00E5FF]">Privacidade</a>
            <span>•</span>
            <a href="#" className="hover:text-[#00E5FF]">Dúvidas Frequentes</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
