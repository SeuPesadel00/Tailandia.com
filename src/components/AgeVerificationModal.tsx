'use client';

import { useState, useEffect } from 'react';

export default function AgeVerificationModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Verifica se já passou pela validação nos últimos 30 dias
    const isVerified = document.cookie.split('; ').find(row => row.startsWith('age_verified='));
    if (!isVerified) {
      setIsOpen(true);
    }
  }, []);

  const handleVerify = (isOver18: boolean) => {
    if (isOver18) {
      // Grava o cookie por 30 dias
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);
      document.cookie = `age_verified=true; expires=${expiry.toUTCString()}; path=/`;
      setIsOpen(false);
    } else {
      // Redireciona ou mostra mensagem
      alert('Você precisa ter mais de 18 anos para acessar este site.');
      window.location.href = 'https://google.com';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-2xl max-w-sm w-full mx-4 text-center">
        <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">Você tem mais de 18 anos?</h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          A venda e o consumo de bebidas alcoólicas são proibidos para menores de 18 anos.
        </p>
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => handleVerify(true)}
            className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold rounded-xl transition-colors"
          >
            SIM, TENHO MAIS DE 18 ANOS
          </button>
          <button 
            onClick={() => handleVerify(false)}
            className="w-full py-3 px-4 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium rounded-xl transition-colors"
          >
            NÃO
          </button>
        </div>
      </div>
    </div>
  );
}
