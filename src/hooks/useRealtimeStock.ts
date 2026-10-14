'use client';

import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';

export interface StockUpdateEvent {
  id: number;
  ean?: string;
  nome?: string;
  estoque_atual: number;
  preco_venda?: number;
  ativo?: boolean;
}

/**
 * Hook para escuta em tempo real (WebSockets / Supabase Realtime)
 * Mantém o catálogo do cliente sincronizado com o estoque físico do PDV instantaneamente.
 */
export function useRealtimeStock(onStockChange?: (update: StockUpdateEvent) => void) {
  useEffect(() => {
    // Canal único e isolado para atualizações de produtos
    const channel = supabase
      .channel('tailandia-produtos-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'produtos'
        },
        (payload: any) => {
          const newRow = payload.new;
          if (!newRow) return;

          const update: StockUpdateEvent = {
            id: Number(newRow.id),
            ean: newRow.ean,
            nome: newRow.nome,
            estoque_atual: Number(newRow.estoque_atual ?? 0),
            preco_venda: newRow.preco_venda ? Number(newRow.preco_venda) : undefined,
            ativo: newRow.ativo,
          };

          // 1. Notifica via callback local
          if (onStockChange) {
            onStockChange(update);
          }

          // 2. Dispara evento customizado no window para sincronizar abas e múltiplos componentes
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent<StockUpdateEvent>('tailandia:stock_updated', {
                detail: update,
              })
            );
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Conectado com sucesso ao WebSocket do banco
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onStockChange]);
}

/**
 * Atualiza um array de produtos com base no evento de estoque recebido do PDV
 */
export function applyStockUpdateToProducts(products: Product[], update: StockUpdateEvent): Product[] {
  return products.map((prod) => {
    if (prod.id === update.id || (update.ean && prod.ean === update.ean)) {
      return {
        ...prod,
        estoque_atual: update.estoque_atual,
        preco_venda: update.preco_venda !== undefined ? update.preco_venda : prod.preco_venda,
        ativo: update.ativo !== undefined ? update.ativo : prod.ativo,
      };
    }
    return prod;
  });
}
