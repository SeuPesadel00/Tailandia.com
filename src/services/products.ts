import { Product } from '../types';

export const REAL_TAILANDIA_PRODUCTS: Product[] = [
  // --- COMBOS PREMIUM ---
  {
    id: 1684,
    ean: 'COMBO-BALLANTINES-12',
    nome: 'Combo Whisky Ballantines 12 Anos 5+5',
    categoria: 'Combos',
    subcategoria: 'Combo de Whisky',
    preco_venda: 180.00,
    preco_promocional: 169.90,
    estoque_atual: 25,
    unidade_medida: 'UN',
    volume: '1L + 5 Red Bull + 5 Gelos',
    imagem_url: 'https://admtai.com/wp-content/uploads/2024/08/Combo-Whisky-Ballantines-12-Anos-1.jpeg',
    descricao: 'Garrafa Whisky Ballantines 12 Anos 1L + 5 energéticos Red Bull 250ml + 5 gelos de coco + 1 água de coco 1L.',
    tags: ['combo', 'whisky', 'red bull', 'gelo de coco'],
    destaque_home: true,
    delivery_online: true,
    selo_especial: 'Combo',
    ativo: true,
  },
  {
    id: 1687,
    ean: 'COMBO-BLACK-LABEL',
    nome: 'Combo Whisky Johnnie Walker Black Label 5+5',
    categoria: 'Combos',
    subcategoria: 'Combo de Whisky',
    preco_venda: 245.00,
    estoque_atual: 18,
    unidade_medida: 'UN',
    volume: '1L + Acompanhamentos',
    imagem_url: 'https://admtai.com/wp-content/uploads/2024/08/Combo-Whisky-Black-Label-1.jpeg',
    descricao: '1 Garrafa Johnnie Walker Black Label 1L + 5 Red Bull Tropical + 5 gelos saborizados + 1 água de coco.',
    tags: ['combo', 'black label', 'luxo', 'whisky'],
    destaque_home: true,
    delivery_online: true,
    selo_especial: 'Mais Vendido',
    ativo: true,
  },
  {
    id: 2006,
    ean: 'COMBO-KRISKOFF-MACA',
    nome: 'Combo Vodka Kriskoff + Baly Maçã Verde 2L + Gelo 4kg',
    categoria: 'Combos',
    subcategoria: 'Combo de Vodka',
    preco_venda: 30.00,
    estoque_atual: 45,
    unidade_medida: 'UN',
    volume: 'Kit Completo',
    imagem_url: 'https://admtai.com/wp-content/uploads/2024/07/images-2026-02-06T235912.855.jpg',
    descricao: 'Vodka Kriskoff 900ml + Energético Baly Maçã Verde 2L + Pacote de Gelo 4kg.',
    tags: ['combo', 'vodka', 'baly', 'resenha'],
    destaque_home: true,
    delivery_online: true,
    selo_especial: 'Promoção',
    ativo: true,
  },
  {
    id: 40161,
    ean: 'COMBO-BEEFEATER-PINK',
    nome: 'Combo Gin Beefeater Pink + 5 Red Bull Tropical + 5 Gelos',
    categoria: 'Combos',
    subcategoria: 'Combo de Gin',
    preco_venda: 170.00,
    estoque_atual: 20,
    unidade_medida: 'UN',
    volume: 'Kit Gin Tônica',
    imagem_url: 'https://admtai.com/wp-content/uploads/2024/10/257482-1-1.webp',
    descricao: 'Gin Beefeater Pink importado + 5 Red Bull Tropical + 5 Gelos de Maracujá artesanais.',
    tags: ['gin', 'beefeater', 'tropical', 'drink'],
    destaque_home: true,
    delivery_online: true,
    selo_especial: 'Combo',
    ativo: true,
  },

  // --- CERVEJAS GELADAS ---
  {
    id: 686,
    ean: '7896045506880',
    nome: 'Caixa Cerveja Heineken 350ml Slim (12 un)',
    categoria: 'Cervejas',
    subcategoria: 'Caixas de Cerveja',
    preco_venda: 65.00,
    preco_promocional: 59.90,
    estoque_atual: 120,
    unidade_medida: 'Caixa',
    volume: '12x 350ml',
    imagem_url: 'https://admtai.com/wp-content/uploads/2024/07/Heineken-350-ml-Slim-com-12-un.webp',
    descricao: 'Pack com 12 latas Heineken 350ml Slim. Puro malte, trincando de gelada.',
    tags: ['cerveja', 'heineken', 'pack', 'gelada'],
    destaque_home: true,
    delivery_online: true,
    selo_especial: 'Gelada',
    ativo: true,
  },
  {
    id: 1169,
    ean: '78936683',
    nome: 'Cerveja Heineken Long Neck 330ml Unidade',
    categoria: 'Cervejas',
    subcategoria: 'Long Neck',
    preco_venda: 8.00,
    estoque_atual: 350,
    unidade_medida: 'Garrafa',
    volume: '330ml',
    imagem_url: 'https://admtai.com/wp-content/uploads/2024/07/Heineken-330-ml-un.jpeg',
    descricao: 'Garrafa Long Neck individual 330ml. Entregue no ponto exato de gelo.',
    tags: ['heineken', 'long neck', 'cerveja gelada'],
    destaque_home: false,
    delivery_online: true,
    selo_especial: 'Gelada',
    ativo: true,
  },
  {
    id: 705,
    ean: '7891991297431',
    nome: 'Caixa Spaten 350ml Slim (12 un)',
    categoria: 'Cervejas',
    subcategoria: 'Caixas de Cerveja',
    preco_venda: 55.00,
    estoque_atual: 95,
    unidade_medida: 'Caixa',
    volume: '12x 350ml',
    imagem_url: 'https://admtai.com/wp-content/uploads/2024/07/Spaten-350-ml-Slim-com-12-un.webp',
    descricao: 'Cerveja puro malte Munich Helles, leve amargor e refrescância inconfundível.',
    tags: ['spaten', 'cerveja', 'puro malte'],
    destaque_home: true,
    delivery_online: true,
    selo_especial: 'Gelada',
    ativo: true,
  },
  {
    id: 675,
    ean: '7891991294959',
    nome: 'Caixa Brahma Duplo Malte 350ml Slim (12 un)',
    categoria: 'Cervejas',
    subcategoria: 'Caixas de Cerveja',
    preco_venda: 52.00,
    estoque_atual: 80,
    unidade_medida: 'Caixa',
    volume: '12x 350ml',
    imagem_url: 'https://admtai.com/wp-content/uploads/2024/07/Brahma-Duplo-Malte-350-ml-Slim-com-12-un.jpg',
    descricao: 'O equilíbrio perfeito entre o malte Pilsner e o malte Munich.',
    tags: ['brahma', 'duplo malte', 'cerveja'],
    destaque_home: false,
    delivery_online: true,
    ativo: true,
  },
  {
    id: 1152,
    ean: '7891149108718',
    nome: 'Cerveja Corona Extra Long Neck 330ml',
    categoria: 'Cervejas',
    subcategoria: 'Long Neck',
    preco_venda: 9.00,
    estoque_atual: 140,
    unidade_medida: 'Garrafa',
    volume: '330ml',
    imagem_url: 'https://admtai.com/wp-content/uploads/2024/07/305-cerveja-corona-long-neck-330ml.jpg',
    descricao: 'A clássica mexicana. Sirva com uma fatia de limão.',
    tags: ['corona', 'long neck', 'limao'],
    destaque_home: true,
    delivery_online: true,
    selo_especial: 'Gelada',
    ativo: true,
  },

  // --- DESTILADOS & WHISKY ---
  {
    id: 1641,
    ean: '82184004364',
    nome: 'Whisky Jack Daniel’s Apple 1L',
    categoria: 'Destilados',
    subcategoria: 'Whisky',
    preco_venda: 175.00,
    preco_promocional: 159.90,
    estoque_atual: 30,
    unidade_medida: 'Garrafa',
    volume: '1 Litro',
    imagem_url: 'https://admtai.com/wp-content/uploads/2024/08/Jack-Daniels-Maca-Verde-1-L.jpeg',
    descricao: 'O autêntico Tennessee Whiskey Jack Daniel’s combinado com licor de maçã verde fresca.',
    tags: ['jack daniels', 'apple', 'whisky'],
    destaque_home: true,
    delivery_online: true,
    selo_especial: 'Mais Vendido',
    ativo: true,
  },
  {
    id: 1651,
    ean: '5000267023601',
    nome: 'Whisky Johnnie Walker Black Label 1L',
    categoria: 'Destilados',
    subcategoria: 'Whisky',
    preco_venda: 190.00,
    estoque_atual: 22,
    unidade_medida: 'Garrafa',
    volume: '1 Litro',
    imagem_url: 'https://admtai.com/wp-content/uploads/2024/08/Black-Label-1-L.jpeg',
    descricao: 'Blended Scotch Whisky 12 anos. Rico, complexo e equilibrado.',
    tags: ['whisky', 'black label', 'johnnie walker'],
    destaque_home: false,
    delivery_online: true,
    ativo: true,
  },
  {
    id: 735,
    ean: '7312040017034',
    nome: 'Vodka Absolut Original 1L',
    categoria: 'Destilados',
    subcategoria: 'Vodka',
    preco_venda: 95.00,
    estoque_atual: 40,
    unidade_medida: 'Garrafa',
    volume: '1 Litro',
    imagem_url: 'https://admtai.com/wp-content/uploads/2024/07/vodka-absolut-1l-vohov5l4lc.webp',
    descricao: 'Vodka sueca icônica, produzida exclusivamente com trigo de inverno e água pura.',
    tags: ['vodka', 'absolut', 'destilado'],
    destaque_home: true,
    delivery_online: true,
    ativo: true,
  },
  {
    id: 1775,
    ean: '5000291020706',
    nome: 'Gin Tanqueray London Dry 750ml',
    categoria: 'Destilados',
    subcategoria: 'Gin',
    preco_venda: 115.00,
    estoque_atual: 35,
    unidade_medida: 'Garrafa',
    volume: '750ml',
    imagem_url: 'https://admtai.com/wp-content/uploads/2024/08/71IsSlovFZL._AC_UF10001000_QL80_.jpg',
    descricao: 'Gin premium destilado quatro vezes, com zimbro marcante e notas cítricas.',
    tags: ['gin', 'tanqueray', 'london dry'],
    destaque_home: false,
    delivery_online: true,
    ativo: true,
  },
  {
    id: 1099,
    ean: '8410221902915',
    nome: 'Licor 43 Diego Zamora 700ml',
    categoria: 'Destilados',
    subcategoria: 'Licores',
    preco_venda: 140.00,
    estoque_atual: 15,
    unidade_medida: 'Garrafa',
    volume: '700ml',
    imagem_url: 'https://admtai.com/wp-content/uploads/2024/07/51hEYrZ90YL.jpg',
    descricao: 'Licor espanhol lendário feito com 43 ingredientes botânicos naturais e cítricos.',
    tags: ['licor 43', 'espanha', 'doce'],
    destaque_home: true,
    delivery_online: true,
    selo_especial: 'Novidade',
    ativo: true,
  },

  // --- TABACARIA & HEADSHOP ---
  {
    id: 4266,
    ean: '7898927097684',
    nome: 'Essência Ziggy Hapocalyx Mint 50g',
    categoria: 'Tabacaria',
    subcategoria: 'Essências',
    preco_venda: 12.00,
    estoque_atual: 200,
    unidade_medida: 'Pacote',
    volume: '50g',
    imagem_url: 'https://admtai.com/wp-content/uploads/2024/10/essencia-ziggy-h-p4ktouwya8.png',
    descricao: 'A essência de menta mais vendida do Brasil. Refrescância extrema e fumaça densa.',
    tags: ['ziggy', 'menta', 'narguile', 'essencia'],
    destaque_home: true,
    delivery_online: true,
    selo_especial: 'Mais Vendido',
    ativo: true,
  },
  {
    id: 16738,
    ean: '8681511387679',
    nome: 'Essência Adalya Ice Watermelon 50g',
    categoria: 'Tabacaria',
    subcategoria: 'Essências',
    preco_venda: 16.00,
    estoque_atual: 85,
    unidade_medida: 'Pacote',
    volume: '50g',
    imagem_url: 'https://admtai.com/wp-content/uploads/2025/05/44e2c153785f6123ec74bfa4630714d1.png',
    descricao: 'Melancia doce combinada com toque gelado incomparável da Adalya.',
    tags: ['adalya', 'ice watermelon', 'narguile'],
    destaque_home: false,
    delivery_online: true,
    ativo: true,
  },
  {
    id: 118,
    ean: '7890000000118',
    nome: 'Carvão de Coco Rainbow Hexagonal 1kg',
    categoria: 'Tabacaria',
    subcategoria: 'Carvão para Narguile',
    preco_venda: 42.00,
    estoque_atual: 110,
    unidade_medida: 'Pacote',
    volume: '1kg',
    imagem_url: 'https://admtai.com/wp-content/uploads/2024/02/Carvao-de-Coco-Rainbow-Hexagonal-1Kg-Tiobob-27951-2.webp',
    descricao: '100% fibra de coco natural, sem cheiro, sem gosto e com queima duradoura de até 90 min.',
    tags: ['carvao', 'coco', 'rainbow', 'narguile'],
    destaque_home: true,
    delivery_online: true,
    ativo: true,
  },
  {
    id: 222,
    ean: '716165280972',
    nome: 'Seda Raw Classic Organic Hemp King Size',
    categoria: 'Tabacaria',
    subcategoria: 'Sedas',
    preco_venda: 10.00,
    estoque_atual: 180,
    unidade_medida: 'Pacote',
    volume: '32 folhas',
    imagem_url: 'https://admtai.com/wp-content/uploads/2024/02/baixados-2026-01-29T184050.624.jpg',
    descricao: 'Seda orgânica Raw feita de cânhamo natural, sem cloro e queima uniforme.',
    tags: ['raw', 'seda', 'hemp', 'king size'],
    destaque_home: true,
    delivery_online: true,
    selo_especial: 'Mais Vendido',
    ativo: true,
  },
  {
    id: 2478,
    ean: '7890000002478',
    nome: 'Pipe de Silicone Pickle Rick Sortido',
    categoria: 'Tabacaria',
    subcategoria: 'Pipes',
    preco_venda: 30.00,
    estoque_atual: 25,
    unidade_medida: 'UN',
    volume: 'Silicone Curado',
    imagem_url: 'https://admtai.com/wp-content/uploads/2026/01/pipe_de_silicone_pickle_rick_sortido_24343_3_47e0af2d2040df3f12c012e49d600af1.webp',
    descricao: 'Pipe de silicone inquebrável com bowl de vidro embutido. Tema Rick & Morty.',
    tags: ['pipe', 'silicone', 'rick and morty'],
    destaque_home: false,
    delivery_online: true,
    ativo: true,
  },

  // --- PETISCOS & BOMBONIERE ---
  {
    id: 1477,
    ean: '7892840822347',
    nome: 'Salgadinho Doritos Queijo Nacho 75g',
    categoria: 'Petiscos & Doces',
    subcategoria: 'Salgadinhos',
    preco_venda: 10.00,
    estoque_atual: 90,
    unidade_medida: 'Pacote',
    volume: '75g',
    imagem_url: 'https://admtai.com/wp-content/uploads/2024/08/doritos-75g.jpg',
    descricao: 'A crocância clássica e o sabor inconfundível de queijo nacho da Elma Chips.',
    tags: ['doritos', 'nacho', 'salgadinho'],
    destaque_home: false,
    delivery_online: true,
    ativo: true,
  },
  {
    id: 1614,
    ean: '78939318',
    nome: 'Chocolate Bombom Ouro Branco Lacta',
    categoria: 'Petiscos & Doces',
    subcategoria: 'Chocolates',
    preco_venda: 2.00,
    estoque_atual: 300,
    unidade_medida: 'UN',
    imagem_url: 'https://admtai.com/wp-content/uploads/2024/08/Lacta-Ouro-Branco.jpg',
    descricao: 'Waffer crocante recheado e coberto com o delicioso chocolate branco Lacta.',
    tags: ['ouro branco', 'chocolate', 'bombom'],
    destaque_home: false,
    delivery_online: true,
    ativo: true,
  },

  // --- GELO & ENERGÉTICOS ---
  {
    id: 1580,
    ean: '751320308283',
    nome: 'Saco de Gelo em Cubo 4kg',
    categoria: 'Gelo & Carvão',
    subcategoria: 'Gelo',
    preco_venda: 6.00,
    estoque_atual: 150,
    unidade_medida: 'Pacote',
    volume: '4kg',
    imagem_url: 'https://admtai.com/wp-content/uploads/2024/08/download-48-2.jpg',
    descricao: 'Gelo filtrado cristalino em cubos para manter sua bebida trincando de gelada.',
    tags: ['gelo', 'cubo', 'festa'],
    destaque_home: true,
    delivery_online: true,
    ativo: true,
  },
  {
    id: 1290,
    ean: '611269991000',
    nome: 'Energético Red Bull Energy Drink 250ml',
    categoria: 'Bebidas',
    subcategoria: 'Energéticos',
    preco_venda: 11.00,
    estoque_atual: 210,
    unidade_medida: 'Lata',
    volume: '250ml',
    imagem_url: 'https://admtai.com/wp-content/uploads/2024/08/l-e7b1c950d4bf4197a2052df45f7572e2.jpeg',
    descricao: 'Red Bull te dá asas. Vitaliza corpo e mente. Entregue estupidamente gelado.',
    tags: ['red bull', 'energetico', 'gelado'],
    destaque_home: true,
    delivery_online: true,
    selo_especial: 'Gelada',
    ativo: true,
  },

  // --- TAILANDIA GRILL ---
  {
    id: 44500,
    ean: 'JANTINHA-COMPLETA-01',
    nome: 'Jantinha Completa Especial Tailândia',
    categoria: 'Tailandia Grill',
    subcategoria: 'Pratos & Jantinhas',
    preco_venda: 20.00,
    estoque_atual: 40,
    unidade_medida: 'UN',
    volume: 'Refeição Completa',
    imagem_url: 'https://admtai.com/wp-content/uploads/2026/07/WhatsApp-Image-2026-07-22-at-12.44.19-PM.jpeg',
    descricao: 'Arroz branco soltinho, feijão tropeiro caprichado, mandioca cozida na manteiga, vinagrete fresco e 1 espetinho à sua escolha.',
    tags: ['jantinha', 'tropeiro', 'espetinho', 'churrasco'],
    destaque_home: true,
    delivery_online: true,
    selo_especial: 'Mais Vendido',
    ativo: true,
  }
];

export interface CategoryMeta {
  id: string;
  slug: string;
  label: string;
  icon: string;
  color: string;
  descricao: string;
  bannerGradient: string;
  dbCategories: string[];
  subcategoriasSugeridas: string[];
}

export const CATEGORIES_CONFIG: Record<string, CategoryMeta> = {
  'tabacaria': {
    id: 'Tabacaria',
    slug: 'tabacaria',
    label: 'Tabacaria & Headshop',
    icon: 'Cigarette',
    color: '#ec4899',
    descricao: 'Narguiles completos, essências premium, carvão de coco, sedas, pods e acessórios com entrega 24h.',
    bannerGradient: 'from-pink-950 via-rose-950 to-slate-950',
    dbCategories: ['Tabacaria', 'Tabacaria & Headshop', 'Headshop'],
    subcategoriasSugeridas: ['Essências', 'Carvão de Coco', 'Sedas & Filtros', 'Isqueiros & Maçaricos', 'Narguiles & Peças', 'Pods & Vapes', 'Palheiros']
  },
  'bebidas': {
    id: 'Bebidas',
    slug: 'bebidas',
    label: 'Bebidas em Geral',
    icon: 'Wine',
    color: '#38bdf8',
    descricao: 'Cervejas trincando de geladas, destilados nacionais e importados, refrigerantes e energéticos.',
    bannerGradient: 'from-sky-950 via-blue-950 to-slate-950',
    dbCategories: ['Bebidas', 'Cervejas', 'Destilados', 'Vinhos', 'Refrigerantes', 'Sucos', 'Energéticos'],
    subcategoriasSugeridas: ['Cervejas', 'Whiskies', 'Gins', 'Vodkas', 'Energéticos', 'Refrigerantes', 'Vinhos']
  },
  'cervejas': {
    id: 'Cervejas',
    slug: 'cervejas',
    label: 'Cervejas Geladas',
    icon: 'Beer',
    color: '#06b6d4',
    descricao: 'Heineken, Corona, Stella, Amstel, Budweiser, Spaten e artesanais em temperatura trincando.',
    bannerGradient: 'from-cyan-950 via-teal-950 to-slate-950',
    dbCategories: ['Cervejas'],
    subcategoriasSugeridas: ['Long Neck', 'Lata 350ml', 'Latão 473ml', 'Garrafa 600ml', 'Zero Álcool', 'Puro Malte']
  },
  'destilados': {
    id: 'Destilados',
    slug: 'destilados',
    label: 'Whiskies & Destilados',
    icon: 'Wine',
    color: '#8b5cf6',
    descricao: 'Os melhores whiskies 12 anos, gins importados, vodkas premium, cachaças artesanais e licores.',
    bannerGradient: 'from-purple-950 via-indigo-950 to-slate-950',
    dbCategories: ['Destilados', 'Whisky', 'Gin', 'Vodka', 'Cachaça', 'Licores'],
    subcategoriasSugeridas: ['Whisky 12 Anos', 'Whisky 8 Anos', 'Gin Importado', 'Vodka Premium', 'Cachaças', 'Licores']
  },
  'combos': {
    id: 'Combos',
    slug: 'combos',
    label: 'Combos & Kits da Resenha',
    icon: 'Flame',
    color: '#f59e0b',
    descricao: 'Kits completos prontos para a festa: garrafa + energéticos Red Bull + gelos saborizados com preço especial.',
    bannerGradient: 'from-amber-950 via-orange-950 to-slate-950',
    dbCategories: ['Combos', 'Kits'],
    subcategoriasSugeridas: ['Combo de Whisky', 'Combo de Gin', 'Combo de Vodka', 'Kits Promocionais']
  },
  'bomboniere': {
    id: 'Petiscos & Doces',
    slug: 'bomboniere',
    label: 'Petiscos & Bomboniere',
    icon: 'Cookie',
    color: '#eab308',
    descricao: 'Doritos, amendoins selecionados, chocolates, chicletes, balas e snacks para acompanhar suas bebidas.',
    bannerGradient: 'from-yellow-950 via-amber-950 to-slate-950',
    dbCategories: ['Petiscos & Doces', 'Bomboniere', 'Snacks', 'Doces'],
    subcategoriasSugeridas: ['Salgadinhos & Batatas', 'Amendoins & Castanhas', 'Chocolates & Balas', 'Snacks']
  },
  'petiscos-doces': {
    id: 'Petiscos & Doces',
    slug: 'petiscos-doces',
    label: 'Petiscos & Bomboniere',
    icon: 'Cookie',
    color: '#eab308',
    descricao: 'Doritos, amendoins selecionados, chocolates, chicletes, balas e snacks para acompanhar suas bebidas.',
    bannerGradient: 'from-yellow-950 via-amber-950 to-slate-950',
    dbCategories: ['Petiscos & Doces', 'Bomboniere', 'Snacks', 'Doces'],
    subcategoriasSugeridas: ['Salgadinhos & Batatas', 'Amendoins & Castanhas', 'Chocolates & Balas', 'Snacks']
  },
  'gelo-carvao': {
    id: 'Gelo & Carvão',
    slug: 'gelo-carvao',
    label: 'Gelo & Carvão',
    icon: 'Snowflake',
    color: '#38bdf8',
    descricao: 'Gelo filtrado em cubos 5kg, gelos saborizados de coco/maracujá e carvão vegetal de primeira para churrasco.',
    bannerGradient: 'from-sky-950 via-cyan-950 to-slate-950',
    dbCategories: ['Gelo & Carvão', 'Gelo', 'Carvão'],
    subcategoriasSugeridas: ['Gelo em Cubo', 'Gelo Saborizado', 'Carvão Vegetal', 'Acendedores']
  },
  'tailandia-grill': {
    id: 'Tailandia Grill',
    slug: 'tailandia-grill',
    label: 'Tailândia Grill & Espetos',
    icon: 'Utensils',
    color: '#f97316',
    descricao: 'Jantinhas completas com tropeiro, arroz, mandioca e vinagrete, além de espetinhos assados na brasa na hora.',
    bannerGradient: 'from-orange-950 via-red-950 to-slate-950',
    dbCategories: ['Tailandia Grill', 'Grill', 'Espetos', 'Churrasco'],
    subcategoriasSugeridas: ['Jantinhas Completas', 'Espetos Tradicionais', 'Queijo Coalho', 'Pão de Alho']
  }
};

export const CATEGORIES_LIST = [
  { id: 'TODAS', slug: '', label: 'Todos os Produtos', icon: 'Sparkles', color: '#10b981' },
  { id: 'Combos', slug: 'combos', label: 'Combos & Kits', icon: 'Flame', color: '#f59e0b' },
  { id: 'Cervejas', slug: 'cervejas', label: 'Cervejas Geladas', icon: 'Beer', color: '#06b6d4' },
  { id: 'Destilados', slug: 'destilados', label: 'Whiskies & Destilados', icon: 'Wine', color: '#8b5cf6' },
  { id: 'Tabacaria', slug: 'tabacaria', label: 'Tabacaria & Headshop', icon: 'Cigarette', color: '#ec4899' },
  { id: 'Gelo & Carvão', slug: 'gelo-carvao', label: 'Gelo & Carvão', icon: 'Snowflake', color: '#38bdf8' },
  { id: 'Tailandia Grill', slug: 'tailandia-grill', label: 'Tailândia Grill', icon: 'Utensils', color: '#f97316' },
  { id: 'Petiscos & Doces', slug: 'bomboniere', label: 'Petiscos & Bomboniere', icon: 'Cookie', color: '#eab308' },
];

export function slugify(text: string): string {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getCategoryBySlug(slug: string): CategoryMeta {
  const cleanSlug = slugify(slug);
  if (CATEGORIES_CONFIG[cleanSlug]) {
    return CATEGORIES_CONFIG[cleanSlug];
  }

  // Tenta encontrar por matching parcial
  for (const key of Object.keys(CATEGORIES_CONFIG)) {
    if (cleanSlug.includes(key) || key.includes(cleanSlug)) {
      return CATEGORIES_CONFIG[key];
    }
  }

  // Fallback dinâmico para categorias criadas no banco de dados
  const labelNormalizado = cleanSlug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  return {
    id: labelNormalizado,
    slug: cleanSlug,
    label: labelNormalizado,
    icon: 'Sparkles',
    color: '#10b981',
    descricao: `Confira todos os itens disponíveis na categoria ${labelNormalizado}.`,
    bannerGradient: 'from-slate-900 via-slate-950 to-slate-900',
    dbCategories: [labelNormalizado],
    subcategoriasSugeridas: []
  };
}

// =========================================================================
// 1. SANITIZAÇÃO DE DADOS: SEPARAÇÃO DE PRODUTOS WEB vs SUBPRODUTOS DE PDV
// =========================================================================

// Termos que identificam itens internos de PDV, composições de combos ou insumos
const SUBPRODUCT_PREFIXES = [
  '[SUB]', '[COMPOSIÇÃO]', '[COMPOSICAO]', '[INSUMO]', '[MODIFICADOR]',
  '[USO INTERNO]', '[INTERNO]', '[AVARIA]', '[PERDA]', '[TESTE]',
  '[DOACAO]', '[DOAÇÃO]', '[PRODUCAO]', '[PRODUÇÃO]', '(SUB)', '(COMPOSICAO)'
];

const INTERNAL_SUPPLIES_KEYWORDS = [
  'BOBINA FISCAL', 'BOBINA TERMICA', 'BOBINA TÉRMICA',
  'CANUDO DESCARTAVEL', 'CANUDO BIODEGRADAVEL', 'CANUDO PLASTICO',
  'COPO DESCARTAVEL', 'COPO PLASTICO USO',
  'SACOLA PLASTICA MILHEIRO', 'SACOLA DE ENTREGA', 'EMBALAGEM PARA VIAGEM FARDO',
  'FITA ADESIVA EMBALAGEM', 'FITA GOMADA',
  'GAS CO2 CHOPEIRA', 'CILINDRO CO2',
  'PA DE GELO', 'PÁ DE GELO',
  'ETIQUETA BALANCA', 'ETIQUETA TÉRMICA',
  'PAPEL ACOPLADO'
];

const INTERNAL_CATEGORIES = [
  'insumos', 'uso e consumo', 'embalagens', 'embalagens internas',
  'patrimonio', 'patrimônio', 'ativo imobilizado', 'descarte',
  'materia-prima', 'matéria-prima', 'materiais de limpeza'
];

/**
 * Retorna true apenas se o produto for vendável para o cliente final na vitrine web.
 * Filtra itens de composição interna do PDV, insumos e produtos com preço zerado.
 */
export function isVendavel(p: any): boolean {
  if (!p) return false;
  if (p.ativo === false) return false;

  // 1. Preço de venda deve ser válido e positivo
  const preco = Number(p.preco_venda ?? p.preco ?? 0);
  if (!Number.isFinite(preco) || preco <= 0) {
    return false;
  }

  // 2. Se possuir a flag explícita de delivery web desativada
  if (p.delivery_online === false) {
    return false;
  }

  const nomeUpper = String(p.nome || '').toUpperCase().trim();
  const catLower = String(p.categoria || '').toLowerCase().trim();

  // 3. Exclui se o nome começar com prefixos de composição de PDV
  for (const prefix of SUBPRODUCT_PREFIXES) {
    if (nomeUpper.startsWith(prefix) || nomeUpper.includes(` ${prefix} `)) {
      return false;
    }
  }

  // 4. Exclui insumos de uso interno e embalagens de balcão
  for (const supply of INTERNAL_SUPPLIES_KEYWORDS) {
    if (nomeUpper.includes(supply)) {
      return false;
    }
  }

  // 5. Exclui categorias estritamente internas da distribuidora
  for (const internalCat of INTERNAL_CATEGORIES) {
    if (catLower.includes(internalCat)) {
      return false;
    }
  }

  return true;
}

/**
 * Filtra uma lista completa de produtos retornando apenas os itens vendáveis na vitrine web
 */
export function filterVendaveis(products: Product[]): Product[] {
  if (!Array.isArray(products)) return [];
  return products.filter(isVendavel);
}

/**
 * Retorna a lista de produtos com maior apelo comercial para a seção de Destaques / Mais Vendidos da Home
 */
export function getFeaturedProducts(products: Product[]): Product[] {
  const vendaveis = filterVendaveis(products);

  // Ordena por prioridade comercial:
  // 1º: Combos e Mais Vendidos (selo_especial === 'Mais Vendido' | 'Combo')
  // 2º: Destaque Home marcado explicitamente
  // 3º: Promoções ativas (preco_promocional menor que preco_venda)
  // 4º: Estoque positivo disponível
  return vendaveis
    .filter(p => p.destaque_home || p.selo_especial || p.categoria === 'Combos' || p.preco_promocional)
    .sort((a, b) => {
      const getScore = (item: Product) => {
        let score = 0;
        if (item.estoque_atual <= 0) score -= 100;
        if (item.selo_especial === 'Mais Vendido') score += 50;
        if (item.categoria === 'Combos') score += 40;
        if (item.destaque_home) score += 30;
        if (item.preco_promocional && item.preco_promocional < item.preco_venda) score += 20;
        if (item.selo_especial === 'Gelada') score += 10;
        return score;
      };
      return getScore(b) - getScore(a);
    })
    .slice(0, 12);
}

export async function fetchProducts(category?: string, query?: string): Promise<Product[]> {
  await new Promise(r => setTimeout(r, 60));

  let items = filterVendaveis(REAL_TAILANDIA_PRODUCTS);

  if (category && category !== 'TODAS') {
    items = items.filter(p => p.categoria.toLowerCase() === category.toLowerCase());
  }

  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    items = items.filter(p => 
      p.nome.toLowerCase().includes(q) ||
      p.descricao.toLowerCase().includes(q) ||
      p.ean.toLowerCase().includes(q) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
    );
  }

  return items;
}

