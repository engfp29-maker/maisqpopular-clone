/* ============================================================
   Farmácia Mais Que Popular — catálogo de dados
   Layout inspirado no e-commerce Pague Menos, adaptado à marca.
   ============================================================ */

const STORE = {
  name: "Farmácia Mais Que Popular",
  short: "+Q Popular",
  tag: "farmácia do Tapanã",
  whatsapp: "5591984087045",
  whatsappFmt: "(91) 98408-7045",
  instagram: "farmaciapopulartapana",
  address: "Rodovia do Tapanã, 183B, Residencial Cabano, Belém-PA",
  hours: "Das 7h30 às 13h e das 15h às 21h30",
  hoursShort: "7h30 às 13h · 15h às 21h30",
  cnpj: "58.405.014/0001-75",
  farmaceutica: "Suellen Silva Reis Palheta · CRF-PA 7602",
  rating: "4,9",
  reviews: "+480",
};

const wpp = (msg) => `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(msg)}`;

/* Categorias do menu principal (estilo Pague Menos) */
const CATEGORIES = [
  { slug: "ofertas", name: "Ofertas", icon: "🔥" },
  { slug: "medicamentos-e-saude", name: "Medicamentos e Saúde", icon: "💊" },
  { slug: "dermo-e-beleza", name: "Dermo e Beleza", icon: "🧴" },
  { slug: "mamaes-e-bebes", name: "Mamães e bebês", icon: "🍼" },
  { slug: "higiene-pessoal", name: "Higiene pessoal", icon: "🧼" },
  { slug: "vida-saudavel", name: "Vida Saudável", icon: "🍊" },
  { slug: "conveniencia", name: "Conveniência", icon: "🛒" },
  { slug: "servicos-de-saude", name: "Serviços de Saúde", icon: "🩺" },
  { slug: "marcas-exclusivas", name: "Marcas Exclusivas", icon: "⭐" },
];

/* Departamentos (navegação por imagem) */
const DEPARTMENTS = [
  { name: "Ofertas", slug: "ofertas", icon: "🔥" },
  { name: "Emagrecedores", slug: "vida-saudavel", icon: "⚖️" },
  { name: "Skincare", slug: "dermo-e-beleza", icon: "🧴" },
  { name: "Azia e Gastrite", slug: "medicamentos-e-saude", icon: "🫗" },
  { name: "Whey Protein", slug: "vida-saudavel", icon: "🥤" },
  { name: "Protetor Solar Facial", slug: "dermo-e-beleza", icon: "☀️" },
];

/* Catálogo de produtos. price em centavos; oldPrice opcional (de/por). */
const PRODUCTS = [
  // Medicamentos e Saúde
  { id: "med-01", cat: "medicamentos-e-saude", name: "Paracetamol 750mg 20 comprimidos", tag: "Genérico", ico: "💊", price: 899, oldPrice: 1290, rating: 4.8, reviews: 214, rx: false },
  { id: "med-02", cat: "medicamentos-e-saude", name: "Dipirona sódica 500mg 20 comprimidos", tag: "Genérico", ico: "💊", price: 649, oldPrice: 999, rating: 4.7, reviews: 388, rx: false },
  { id: "med-03", cat: "medicamentos-e-saude", name: "Omeprazol 20mg 28 cápsulas", tag: "Azia e Gastrite", ico: "🫗", price: 1490, oldPrice: 2190, rating: 4.9, reviews: 502, rx: false },
  { id: "med-04", cat: "medicamentos-e-saude", name: "Loratadina 10mg 12 comprimidos", tag: "Antialérgico", ico: "💊", price: 790, oldPrice: 1090, rating: 4.6, reviews: 176, rx: false },
  { id: "med-05", cat: "medicamentos-e-saude", name: "Amoxicilina 500mg 21 cápsulas", tag: "Antibiótico", ico: "💊", price: 2290, rating: 4.8, reviews: 94, rx: true },
  { id: "med-06", cat: "medicamentos-e-saude", name: "Termômetro digital de testa", tag: "MIPS", ico: "🌡️", price: 4990, oldPrice: 6990, rating: 4.7, reviews: 331, rx: false },
  { id: "med-07", cat: "medicamentos-e-saude", name: "Medidor de pressão digital de braço", tag: "MIPS", ico: "🩺", price: 18990, oldPrice: 24990, rating: 4.8, reviews: 210, rx: false },
  { id: "med-08", cat: "medicamentos-e-saude", name: "Soro fisiológico 0,9% 500ml", tag: "Cuidados", ico: "💧", price: 1290, rating: 4.9, reviews: 640, rx: false },

  // Dermo e Beleza
  { id: "der-01", cat: "dermo-e-beleza", name: "Protetor solar facial FPS 60 40g", tag: "Dermocosméticos", ico: "☀️", price: 5990, oldPrice: 8490, rating: 4.9, reviews: 1204, rx: false },
  { id: "der-02", cat: "dermo-e-beleza", name: "Hidratante corporal 400ml", tag: "Dermocosméticos", ico: "🧴", price: 3490, oldPrice: 4590, rating: 4.7, reviews: 542, rx: false },
  { id: "der-03", cat: "dermo-e-beleza", name: "Sabonete facial de limpeza profunda", tag: "Skincare", ico: "🫧", price: 2790, oldPrice: 3690, rating: 4.8, reviews: 388, rx: false },
  { id: "der-04", cat: "dermo-e-beleza", name: "Sérum vitamina C 30ml", tag: "Skincare", ico: "🧪", price: 6990, oldPrice: 9990, rating: 4.9, reviews: 733, rx: false },
  { id: "der-05", cat: "dermo-e-beleza", name: "Shampoo anticaspa 400ml", tag: "Cabelos", ico: "🧴", price: 2390, oldPrice: 3190, rating: 4.6, reviews: 421, rx: false },
  { id: "der-06", cat: "dermo-e-beleza", name: "Condicionador hidratante 400ml", tag: "Cabelos", ico: "🧴", price: 2190, rating: 4.5, reviews: 287, rx: false },
  { id: "der-07", cat: "dermo-e-beleza", name: "Colônia feminina 100ml", tag: "Perfumaria", ico: "🌸", price: 8990, oldPrice: 11990, rating: 4.8, reviews: 355, rx: false },
  { id: "der-08", cat: "dermo-e-beleza", name: "Esmalte longa duração", tag: "Perfumaria", ico: "💅", price: 990, oldPrice: 1590, rating: 4.5, reviews: 198, rx: false },

  // Mamães e bebês
  { id: "beb-01", cat: "mamaes-e-bebes", name: "Fralda infantil pacote econômico M", tag: "Vários tamanhos", ico: "🧷", price: 4990, oldPrice: 6490, rating: 4.8, reviews: 912, rx: false },
  { id: "beb-02", cat: "mamaes-e-bebes", name: "Lenço umedecido 100 folhas", tag: "Infantil", ico: "🧻", price: 1490, oldPrice: 1990, rating: 4.9, reviews: 1502, rx: false },
  { id: "beb-03", cat: "mamaes-e-bebes", name: "Sabonete líquido infantil 400ml", tag: "Infantil", ico: "🧴", price: 1890, rating: 4.7, reviews: 408, rx: false },
  { id: "beb-04", cat: "mamaes-e-bebes", name: "Mamadeira anticólica 260ml", tag: "Bebê", ico: "🍼", price: 3990, oldPrice: 4990, rating: 4.6, reviews: 233, rx: false },
  { id: "beb-05", cat: "mamaes-e-bebes", name: "Pomada para assadura 45g", tag: "Bebê", ico: "🧴", price: 2590, oldPrice: 3290, rating: 4.9, reviews: 517, rx: false },

  // Higiene pessoal
  { id: "hig-01", cat: "higiene-pessoal", name: "Creme dental 90g", tag: "Higiene", ico: "🪥", price: 790, oldPrice: 1090, rating: 4.7, reviews: 640, rx: false },
  { id: "hig-02", cat: "higiene-pessoal", name: "Desodorante aerossol 150ml", tag: "Perfumaria", ico: "🧼", price: 1590, oldPrice: 2190, rating: 4.6, reviews: 523, rx: false },
  { id: "hig-03", cat: "higiene-pessoal", name: "Papel higiênico 12 rolos", tag: "Casa", ico: "🧻", price: 2490, oldPrice: 3190, rating: 4.8, reviews: 871, rx: false },
  { id: "hig-04", cat: "higiene-pessoal", name: "Absorvente noturno 8 unidades", tag: "Higiene", ico: "🩸", price: 1190, oldPrice: 1590, rating: 4.7, reviews: 402, rx: false },
  { id: "hig-05", cat: "higiene-pessoal", name: "Sabonete glicerinado 90g", tag: "Higiene", ico: "🧼", price: 490, rating: 4.5, reviews: 289, rx: false },
  { id: "hig-06", cat: "higiene-pessoal", name: "Fralda geriátrica pacote G", tag: "Cuidado do Idoso", ico: "🧓", price: 5990, oldPrice: 7490, rating: 4.8, reviews: 366, rx: false },

  // Vida Saudável
  { id: "sau-01", cat: "vida-saudavel", name: "Vitamina C 1g efervescente 10 comprimidos", tag: "Vitaminas", ico: "🍊", price: 1990, oldPrice: 2690, rating: 4.8, reviews: 745, rx: false },
  { id: "sau-02", cat: "vida-saudavel", name: "Polivitamínico A-Z 60 cápsulas", tag: "Vitaminas", ico: "💊", price: 4590, oldPrice: 5990, rating: 4.9, reviews: 903, rx: false },
  { id: "sau-03", cat: "vida-saudavel", name: "Whey protein concentrado 900g", tag: "Suplementos", ico: "🥤", price: 14990, oldPrice: 18990, rating: 4.7, reviews: 512, rx: false },
  { id: "sau-04", cat: "vida-saudavel", name: "Ômega 3 1000mg 60 cápsulas", tag: "Suplementos", ico: "🐟", price: 5990, oldPrice: 7990, rating: 4.8, reviews: 388, rx: false },
  { id: "sau-05", cat: "vida-saudavel", name: "Colágeno hidrolisado 300g", tag: "Suplementos", ico: "✨", price: 7990, oldPrice: 9990, rating: 4.7, reviews: 621, rx: false },
  { id: "sau-06", cat: "vida-saudavel", name: "Emagrecedor termogênico 60 cápsulas", tag: "Emagrecedores", ico: "⚖️", price: 9990, oldPrice: 12990, rating: 4.4, reviews: 245, rx: false },

  // Conveniência
  { id: "con-01", cat: "conveniencia", name: "Álcool em gel 70% 500ml", tag: "Cuidados", ico: "🧪", price: 1590, oldPrice: 2190, rating: 4.9, reviews: 812, rx: false },
  { id: "con-02", cat: "conveniencia", name: "Máscara descartável 50 unidades", tag: "Proteção", ico: "😷", price: 1990, oldPrice: 2990, rating: 4.6, reviews: 431, rx: false },
  { id: "con-03", cat: "conveniencia", name: "Curativo adesivo 20 unidades", tag: "Primeiros socorros", ico: "🩹", price: 890, rating: 4.5, reviews: 267, rx: false },
  { id: "con-04", cat: "conveniencia", name: "Água mineral 1,5L", tag: "Bebidas", ico: "💧", price: 390, rating: 4.4, reviews: 158, rx: false },
  { id: "con-05", cat: "conveniencia", name: "Álcool 70% 1L", tag: "Cuidados", ico: "🧴", price: 1290, oldPrice: 1690, rating: 4.8, reviews: 503, rx: false },

  // Serviços de Saúde
  { id: "ser-01", cat: "servicos-de-saude", name: "Aferição de pressão arterial", tag: "Serviço na loja", ico: "🩺", price: 0, rating: 5, reviews: 120, rx: false, service: true },
  { id: "ser-02", cat: "servicos-de-saude", name: "Aplicação de injetáveis", tag: "Serviço na loja", ico: "💉", price: 2000, rating: 4.9, reviews: 84, rx: false, service: true },
  { id: "ser-03", cat: "servicos-de-saude", name: "Teste de glicemia", tag: "Serviço na loja", ico: "🩸", price: 1500, rating: 4.8, reviews: 97, rx: false, service: true },

  // Marcas Exclusivas
  { id: "mar-01", cat: "marcas-exclusivas", name: "Linha +Q Cuidado hidratante corporal", tag: "Marca exclusiva", ico: "🧴", price: 2990, oldPrice: 3990, rating: 4.8, reviews: 312, rx: false },
  { id: "mar-02", cat: "marcas-exclusivas", name: "+Q Infantil kit shampoo e sabonete", tag: "Marca exclusiva", ico: "🍼", price: 3490, oldPrice: 4490, rating: 4.7, reviews: 208, rx: false },
  { id: "mar-03", cat: "marcas-exclusivas", name: "+Q Saúde vitamina C 500mg 30 comprimidos", tag: "Marca exclusiva", ico: "🍊", price: 1590, oldPrice: 2190, rating: 4.9, reviews: 456, rx: false },
];

/* Helpers */
const byId = (id) => PRODUCTS.find((p) => p.id === id);
const byCat = (slug) => (slug === "ofertas" ? PRODUCTS.filter((p) => p.oldPrice) : PRODUCTS.filter((p) => p.cat === slug));
const catName = (slug) => (CATEGORIES.find((c) => c.slug === slug) || {}).name || "Produtos";

const brl = (cents) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const discountPct = (p) =>
  p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;

/* Exporta para uso global no browser */
window.STORE = STORE;
window.wpp = wpp;
window.CATEGORIES = CATEGORIES;
window.DEPARTMENTS = DEPARTMENTS;
window.PRODUCTS = PRODUCTS;
window.byId = byId;
window.byCat = byCat;
window.catName = catName;
window.brl = brl;
window.discountPct = discountPct;
