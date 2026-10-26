import React from 'react';

interface BrandMarkProps {
  className?: string;
  variant?: 'svg' | 'image' | 'color';
}

/**
 * Logo TAILÂNDIA — Elefantes Tailandeses + Narguilé.
 * Suporta o SVG neon customizado ou a imagem oficial em PNG de alta resolução.
 */
export default function BrandMark({ className = 'h-10 w-14', variant = 'image' }: BrandMarkProps) {
  if (variant === 'image') {
    return (
      <img
        src="/imagens/tai logo canvas.png"
        alt="Tailândia Bebidas & Tabacaria"
        className={`object-contain drop-shadow-[0_0_10px_rgba(0,229,255,0.45)] ${className}`}
        onError={(e) => {
          // Fallback para SVG se a imagem falhar
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  if (variant === 'color') {
    return (
      <img
        src="/imagens/tai logo canvas color.png"
        alt="Tailândia Bebidas & Tabacaria"
        className={`rounded-xl object-contain shadow-[0_0_15px_rgba(0,229,255,0.35)] ${className}`}
      />
    );
  }

  return (
    <svg
      className={`neon-svg ${className}`}
      viewBox="0 0 120 70"
      fill="none"
      aria-hidden="true"
    >
      {/* Elefante esquerdo */}
      <path
        d="M12 58 L12 40 C12 26, 26 22, 36 25 C40 20, 48 22, 50 28 C53 26, 55 16, 52 12 C50 10, 54 8, 56 12 C59 18, 57 32, 48 35 L46 58 L40 58 L40 44 L22 44 L22 58 Z"
        stroke="var(--primary-color)"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {/* Narguilé central */}
      <path
        d="M60 16 L60 44 M55 20 L65 20 M54 58 C54 50, 66 50, 66 58 Z"
        stroke="var(--primary-color)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Elefante direito */}
      <path
        d="M108 58 L108 40 C108 26, 94 22, 84 25 C80 20, 72 22, 70 28 C67 26, 65 16, 68 12 C70 10, 66 8, 64 12 C61 18, 63 32, 72 35 L74 58 L80 58 L80 44 L98 44 L98 58 Z"
        stroke="var(--primary-color)"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
