import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { REAL_TAILANDIA_PRODUCTS } from '@/services/products';
import { Product } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rgggdawwkmcnpfetuhij.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseKey || supabaseKey.includes('...')) {
      // Chaves ainda não totalmente preenchidas no .env: retorna catálogo demonstrativo completo
      return NextResponse.json(REAL_TAILANDIA_PRODUCTS);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: dbProducts, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('ativo', true)
      .order('id', { ascending: true });

    if (error || !dbProducts || dbProducts.length === 0) {
      // Fallback seguro caso o banco ainda esteja vazio ou ocorra erro de conexão
      return NextResponse.json(REAL_TAILANDIA_PRODUCTS);
    }

    // Mapa de produtos padrão para enriquecimento visual (imagens em alta, selos e tags)
    const fallbackMap = new Map<string, Product>();
    REAL_TAILANDIA_PRODUCTS.forEach(p => fallbackMap.set(String(p.ean), p));

    const mergedProducts: Product[] = dbProducts.map((p: any) => {
      const eanStr = String(p.ean || '');
      const fallback = fallbackMap.get(eanStr);

      return {
        id: p.id,
        ean: eanStr,
        sku: p.sku || fallback?.sku,
        nome: p.nome || fallback?.nome || 'Produto Sem Nome',
        categoria: p.categoria || fallback?.categoria || 'Diversos',
        subcategoria: p.subcategoria || fallback?.subcategoria,
        preco_venda: Number(p.preco_venda ?? fallback?.preco_venda ?? 0),
        preco_promocional: p.preco_promocional ? Number(p.preco_promocional) : fallback?.preco_promocional,
        preco_custo: p.preco_custo ? Number(p.preco_custo) : fallback?.preco_custo,
        estoque_atual: Number(p.estoque_atual ?? 0),
        unidade_medida: p.unidade_medida || fallback?.unidade_medida || 'UN',
        volume: p.volume || fallback?.volume,
        imagem_url: p.imagem_url || fallback?.imagem_url || 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=600&q=80',
        descricao: p.descricao || fallback?.descricao || '',
        descricao_completa: p.descricao_completa || fallback?.descricao_completa,
        tags: Array.isArray(p.tags) ? p.tags : fallback?.tags || [],
        destaque_home: p.destaque_home ?? fallback?.destaque_home ?? false,
        delivery_online: p.delivery_online ?? fallback?.delivery_online ?? true,
        selo_especial: p.selo_especial || fallback?.selo_especial,
        ativo: p.ativo !== false,
        wp_id: p.wp_id || fallback?.wp_id,
        rating: fallback?.rating || 4.8,
        reviewsCount: fallback?.reviewsCount || 12,
      };
    });

    return NextResponse.json(mergedProducts);
  } catch (err: any) {
    console.error('Erro ao buscar produtos do Supabase:', err);
    return NextResponse.json(REAL_TAILANDIA_PRODUCTS);
  }
}
