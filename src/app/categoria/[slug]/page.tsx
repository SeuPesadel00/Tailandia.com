import React from 'react';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import CategoryPills from '@/components/CategoryPills';
import CategoryCatalogView from '@/components/CategoryCatalogView';
import Footer from '@/components/Footer';
import { getCategoryBySlug } from '@/services/products';

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const category = getCategoryBySlug(params.slug);
  return {
    title: `${category.label} | Delivery 24h Tailândia Distribuidora`,
    description: category.descricao,
    openGraph: {
      title: `${category.label} - Tailândia Distribuidora & Tabacaria`,
      description: category.descricao,
    },
  };
}

export default function CategoryPage({ params }: CategoryPageProps) {
  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col text-slate-100">
      {/* Header Sticky */}
      <Header />

      {/* Barra de Categorias */}
      <CategoryPills />

      {/* Conteúdo Exclusivo da Categoria */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <CategoryCatalogView categorySlug={params.slug} />
      </main>

      {/* Rodapé Institucional */}
      <Footer />
    </div>
  );
}
