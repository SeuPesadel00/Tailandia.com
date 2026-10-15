import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { REAL_TAILANDIA_PRODUCTS, filterVendaveis, isVendavel, getCategoryBySlug } from '@/services/products';
import { Product } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get('categoria') || '';
    const slugParam = searchParams.get('slug') || '';
    const subParam = searchParams.get('sub') || '';
    const searchParam = (searchParams.get('busca') || searchParams.get('q') || '').trim().toLowerCase();
    const isFeaturedOnly = searchParams.get('destaque') === 'true';

    const supabaseUrl = (
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rgggdawwkmncpfetuhij.supabase.co'
    ).replace(/rgggdawwkmcnpfetuhij/g, 'rgggdawwkmncpfetuhij');
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnZ2dkYXd3a21uY3BmZXR1aGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NTUyNjgsImV4cCI6MjEwNjQzMTI2OH0.1uXP6pHtcdfKlmuB1rIcnhVQf9uCT3Yb9iyIuo9hZNc';

    let rawProducts: any[] = [];

    if (supabaseKey && !supabaseKey.includes('...')) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Busca com range expandido selecionando estritamente colunas públicas (protege margem e dados fiscais)
      let query = supabase
        .from('produtos')
        .select('id, ean, sku, nome, categoria, subcategoria, preco_venda, preco_promocional, estoque_atual, unidade_medida, volume, imagem_url, descricao, descricao_completa, tags, destaque_home, delivery_online, selo_especial, ativo, wp_id')
        .eq('ativo', true)
        .order('id', { ascending: true })
        .range(0, 3000);

      const { data: dbProducts, error } = await query;

      if (!error && dbProducts && dbProducts.length > 0) {
        rawProducts = dbProducts;
      } else {
        console.warn('Fallback: Supabase vazio ou indisponível, usando catálogo base');
        rawProducts = REAL_TAILANDIA_PRODUCTS;
      }
    } else {
      rawProducts = REAL_TAILANDIA_PRODUCTS;
    }

    // Mapa de enriquecimento visual (imagens de alta definição e selos da Tailândia)
    const fallbackMap = new Map<string, Product>();
    REAL_TAILANDIA_PRODUCTS.forEach(p => fallbackMap.set(String(p.ean), p));

    // Mapeamento e normalização dos dados (sem expor preco_custo ou dados fiscais)
    const mappedProducts: Product[] = rawProducts.map((p: any) => {
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
        reviewsCount: fallback?.reviewsCount || 15,
      };
    });

    // 1. SANITIZAÇÃO: Remove subprodutos de PDV, insumos internos e itens sem preço
    let filtered = filterVendaveis(mappedProducts);

    // 2. Filtro por Categoria / Slug
    if (slugParam && slugParam !== 'todas') {
      const catMeta = getCategoryBySlug(slugParam);
      const targetDbCategories = (catMeta.dbCategories || [catMeta.id]).map(c => c.toLowerCase());
      filtered = filtered.filter(p => targetDbCategories.includes((p.categoria || '').toLowerCase()));
    } else if (categoryParam && categoryParam !== 'TODAS') {
      filtered = filtered.filter(p => (p.categoria || '').toLowerCase() === categoryParam.toLowerCase());
    }

    // 3. Filtro por Subcategoria
    if (subParam && subParam !== 'TODAS') {
      filtered = filtered.filter(p => (p.subcategoria || '').toLowerCase() === subParam.toLowerCase());
    }

    // 4. Filtro por Busca Textual
    if (searchParam) {
      filtered = filtered.filter(p =>
        p.nome.toLowerCase().includes(searchParam) ||
        p.descricao?.toLowerCase().includes(searchParam) ||
        p.ean?.toLowerCase().includes(searchParam) ||
        p.subcategoria?.toLowerCase().includes(searchParam) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(searchParam)))
      );
    }

    // 5. Filtro de Destaques / Mais Vendidos
    if (isFeaturedOnly) {
      filtered = filtered.filter(p => p.destaque_home || p.selo_especial || p.categoria === 'Combos');
    }

    return NextResponse.json(filtered, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120'
      }
    });
  } catch (err: any) {
    console.error('Erro na API de produtos:', err);
    return NextResponse.json(filterVendaveis(REAL_TAILANDIA_PRODUCTS));
  }
}
