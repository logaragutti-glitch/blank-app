export type ResearchedEventStyle = {
  name: string;
  description: string;
  dimensionScores: Record<string, number>;
  paletteColors: string[];
  furnitureNotes: string[];
  loungeNotes: string[];
  sourceUrls: string[];
};

export const RESEARCHED_EVENT_STYLES: ResearchedEventStyle[] = [
  {
    name: "Naturalismo Moderno",
    description: "Natureza organizada com movimento, textura e aparência orgânica, sem repetir fórmulas boho já saturadas.",
    dimensionScores: { Natural: 9, Contemporâneo: 7, Autoral: 8, Acolhedor: 8 },
    paletteColors: ["Cloud Dancer", "verde oliva", "palha", "branco", "verde musgo"],
    furnitureNotes: ["madeira clara", "fibra natural", "mesas de linhas orgânicas", "cadeiras de madeira"],
    loungeNotes: ["rattan", "linho natural", "pufes de fibras", "almofadas em tons de terra"],
    sourceUrls: ["https://www.constancezahn.com/30-tendencias-de-decoracao-de-casamento-para-2026/"],
  },
  {
    name: "Artsy Editorial",
    description: "Decoração autoral com arquitetura, instalações escultóricas e contraste cromático tratado como linguagem visual.",
    dimensionScores: { Autoral: 9, Contemporâneo: 9, Dramático: 8, Luxuoso: 7 },
    paletteColors: ["azul intenso", "verde escuro", "prata", "branco", "vermelho"],
    furnitureNotes: ["mobiliário escultórico", "mesas de alto contraste", "cadeiras com desenho marcante"],
    loungeNotes: ["veludo", "prata", "formas curvas", "peças statement"],
    sourceUrls: ["https://www.constancezahn.com/30-tendencias-de-decoracao-de-casamento-para-2026/"],
  },
  {
    name: "Romance Terroso",
    description: "Romance natural e quente, equilibrando verde, argila e rosados para ambientes ao ar livre ou de atmosfera acolhedora.",
    dimensionScores: { Romântico: 8, Natural: 8, Acolhedor: 9, Boêmio: 6 },
    paletteColors: ["verde sálvia", "terracota", "areia", "rosa queimado", "champagne"],
    furnitureNotes: ["madeira clara", "mesas de madeira", "ferro branco", "mesas comunitárias"],
    loungeNotes: ["linho", "rattan", "tecidos naturais", "almofadas em terracota"],
    sourceUrls: ["https://www.zola.com/expert-advice/wedding-color-trends-green-neutrals", "https://www.constancezahn.com/30-tendencias-de-decoracao-de-casamento-para-2026/"],
  },
  {
    name: "Ethereal Shimmer",
    description: "Romance etéreo com transparências, reflexos opalescentes e brilho controlado para uma experiência luminosa.",
    dimensionScores: { Romântico: 8, Etéreo: 9, Luxuoso: 8, Contemporâneo: 7 },
    paletteColors: ["Cloud Dancer", "opalina", "lilás", "malva", "prata"],
    furnitureNotes: ["vidro", "metal cromado", "mesas claras", "cadeiras translúcidas"],
    loungeNotes: ["tecidos fluidos", "pérolas", "veludo claro", "acessórios iridescentes"],
    sourceUrls: ["https://newsroom.pinterest.com/news/wedding-trend-report-2026/", "https://www.pantone.com/na/en-us/color-of-the-year/2026"],
  },
  {
    name: "Monocromia Bold",
    description: "Uma cor protagonista aplicada em bloco e com intenção, criando impacto sem depender de excesso de elementos.",
    dimensionScores: { Dramático: 9, Contemporâneo: 8, Autoral: 8, Energético: 8 },
    paletteColors: ["vermelho", "amarelo", "azul intenso", "verde escuro"],
    furnitureNotes: ["mobiliário na cor protagonista", "mesas de alto contraste", "estruturas geométricas"],
    loungeNotes: ["veludo colorido", "metal", "formas modulares", "tecidos em bloco de cor"],
    sourceUrls: ["https://www.constancezahn.com/30-tendencias-de-decoracao-de-casamento-para-2026/"],
  },
  {
    name: "Quiet Luxury Natural",
    description: "Sofisticação discreta baseada em materiais de qualidade, poucos gestos e uma paleta neutra com profundidade.",
    dimensionScores: { Luxuoso: 9, Natural: 7, Contemporâneo: 8, Atemporal: 9 },
    paletteColors: ["Cloud Dancer", "marfim", "verde sálvia", "carvão", "dourado suave"],
    furnitureNotes: ["madeira nobre", "linho", "metal fosco", "mesas de acabamento natural"],
    loungeNotes: ["lã", "veludo discreto", "couro natural", "rattan refinado"],
    sourceUrls: ["https://www.zola.com/expert-advice/wedding-color-trends-green-neutrals", "https://www.pantone.com/na/en-us/color-of-the-year/2026"],
  },
  {
    name: "Destination Sensorial",
    description: "Estilo orientado à experiência do convidado, ao cenário e à atmosfera do destino, com transições de luz, som e textura.",
    dimensionScores: { Experiencial: 9, Acolhedor: 8, Autoral: 8, Natural: 7 },
    paletteColors: ["midnight teal", "azul meia-noite", "ameixa", "olive", "champagne"],
    furnitureNotes: ["mesas comunitárias", "bares cenográficos", "mobiliário de exterior", "cadeiras confortáveis"],
    loungeNotes: ["veludo", "linho", "almofadas táteis", "peças de apoio para convivência"],
    sourceUrls: ["https://newsroom.pinterest.com/news/wedding-trend-report-2026/", "https://www.theknot.com/content/domestination-wedding-definition"],
  },
  {
    name: "Garden Fine Art 2026",
    description: "Evolução do Garden Fine Art com jardim autoral, textura de natureza e detalhes etéreos sem perder elegância.",
    dimensionScores: { Luxuoso: 8, Natural: 8, Romântico: 9, Autoral: 7 },
    paletteColors: ["Cloud Dancer", "verde sálvia", "champagne", "rosé", "dourado suave"],
    furnitureNotes: ["madeira clara", "ferro branco", "mesas de jardim", "cadeiras claras"],
    loungeNotes: ["fibra natural", "linho", "rattan claro", "almofadas rosadas"],
    sourceUrls: ["https://www.zola.com/expert-advice/wedding-color-trends-green-neutrals", "https://newsroom.pinterest.com/news/wedding-trend-report-2026/"],
  },
];
