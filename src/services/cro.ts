import { Product } from '../types';

export const FREE_SHIPPING_THRESHOLD = 150.00; // Exemplo: Frete grátis acima de R$150

export function getBumpOffers(cartItems: { product: Product, quantity: number }[], allProducts: Product[]): Product[] {
  const bumpOffers = new Set<Product>();
  
  const inCartEans = new Set(cartItems.map(i => i.product.ean));

  cartItems.forEach(item => {
    const p = item.product;
    // Lógica para adicionar Bump Offers baseada no item
    if (p.categoria === 'Destilados' || p.nome.toLowerCase().includes('whisky') || p.nome.toLowerCase().includes('gin') || p.nome.toLowerCase().includes('vodka')) {
      // Oferece Gelo, Energético
      const gelo = allProducts.find(x => x.nome.toLowerCase().includes('gelo') && !inCartEans.has(x.ean));
      const energetico = allProducts.find(x => x.nome.toLowerCase().includes('energético') || x.nome.toLowerCase().includes('red bull') && !inCartEans.has(x.ean));
      if (gelo) bumpOffers.add(gelo);
      if (energetico) bumpOffers.add(energetico);
    }

    if (p.categoria === 'Cervejas') {
      const petisco = allProducts.find(x => (x.categoria === 'Petiscos & Doces' || x.nome.toLowerCase().includes('amendoim') || x.nome.toLowerCase().includes('doritos')) && !inCartEans.has(x.ean));
      if (petisco) bumpOffers.add(petisco);
    }
  });

  return Array.from(bumpOffers).slice(0, 3); // Retorna até 3 ofertas
}
