export interface RegionalTechnicalSupplier {
  name: string;
  category: "LIGHTING" | "MUSIC" | "OTHER";
  phone?: string;
  email?: string;
  website?: string;
  instagramUrl?: string;
  serviceArea: string[];
  sourceUrl: string | null;
  validationLevel: "A" | "B" | "C";
  contactStatus: "CONFIRMED_PUBLIC" | "DIRECTORY_ONLY" | "LEAD_UNCONFIRMED";
  services: string[];
  notes: string;
}

export const REGIONAL_TECHNICAL_SUPPLIERS: RegionalTechnicalSupplier[] = [
  {
    name: "Ricos Eventos",
    category: "LIGHTING",
    phone: "(22) 2647-1664",
    website: "https://ricoseventos.com.br/",
    serviceArea: ["Cabo Frio", "Região dos Lagos"],
    sourceUrl: "https://ricoseventos.com.br/",
    validationLevel: "A",
    contactStatus: "CONFIRMED_PUBLIC",
    services: ["sonorização", "iluminação", "estruturas", "painel de LED", "pista de LED", "palco", "equipe técnica"],
    notes:
      "Site próprio declara mais de dez anos de atuação e especialização em eventos e aluguel de equipamentos na Região dos Lagos. Fonte indexada também publica contato alternativo +55 22 99969-3636; confirmar qual número está vigente.",
  },
  {
    name: "RJ Sound",
    category: "LIGHTING",
    phone: "(21) 97674-6837",
    email: "rjsoundrio@gmail.com",
    website: "http://www.djrabrantes.com/rjsound",
    instagramUrl: "https://www.instagram.com/rjsoundrio/",
    serviceArea: ["Búzios", "Região dos Lagos"],
    sourceUrl: "https://www.casamentoembuzios.com/guia/rj-sound/",
    validationLevel: "A",
    contactStatus: "CONFIRMED_PUBLIC",
    services: ["som profissional", "iluminação profissional", "DJ", "estrutura técnica"],
    notes: "Fornecedor listado na categoria Som e Iluminação de guia especializado de casamentos em Búzios. Confirmar atendimento fora de Búzios, rider, gerador e equipe de operação.",
  },
  {
    name: "Osmar Eventos",
    category: "MUSIC",
    serviceArea: ["Búzios", "Região dos Lagos"],
    sourceUrl: "https://www.casamentos.com.br/musica-de-casamento/osmar-eventos--e203964",
    validationLevel: "A",
    contactStatus: "DIRECTORY_ONLY",
    services: ["DJ", "som", "iluminação", "estrutura", "repertório para casamento"],
    notes: "Ficha especializada informa base em Armação dos Búzios, equipamentos de ponta e DJ; preço publicado a partir de R$500 é apenas indicativo e deve ser confirmado.",
  },
  {
    name: "Perfect Eventos / Som e Iluminação",
    category: "LIGHTING",
    serviceArea: ["Cabo Frio", "São Pedro da Aldeia", "Estado do Rio de Janeiro"],
    sourceUrl: "https://tudodefestaoficial.com/guia/guiacomercial/som-luz-e-imagens-eventos-em-cabo-frio/",
    validationLevel: "A",
    contactStatus: "DIRECTORY_ONLY",
    services: ["som", "DJ", "iluminação", "iluminação cênica", "estruturas", "pista de LED", "painel de LED", "palco", "projeção", "fogos indoor"],
    notes: "Página regional oferece casamentos e declara atendimento em todo o Estado do Rio. Nome legal e contato direto não ficaram legíveis na fonte; confirmar responsável, rider, ART, gerador e seguro.",
  },
  {
    name: "Felipe Manolo Costa",
    category: "MUSIC",
    serviceArea: ["Búzios", "Cabo Frio", "Arraial do Cabo", "Região dos Lagos"],
    sourceUrl: null,
    validationLevel: "C",
    contactStatus: "LEAD_UNCONFIRMED",
    services: ["DJ", "sonorização", "iluminação", "palco"],
    notes: "Lead encontrado em publicação indexada com atuação em Búzios, Cabo Frio e Arraial do Cabo. Não foi localizado contato direto ou site próprio suficientemente validado.",
  },
  {
    name: "DJ Marcelo Cigarra",
    category: "MUSIC",
    serviceArea: ["Região dos Lagos"],
    sourceUrl: null,
    validationLevel: "C",
    contactStatus: "LEAD_UNCONFIRMED",
    services: ["DJ", "sonorização", "iluminação"],
    notes: "Lead encontrado em publicações indexadas com DJ, iluminação e sonorização na Região dos Lagos. Confirmar contato, equipamento próprio, cobertura e portfólio de casamentos.",
  },
  {
    name: "Fabrício Music",
    category: "MUSIC",
    serviceArea: ["Cabo Frio", "Região dos Lagos"],
    sourceUrl: "https://www.casamentos.com.br/musica-de-casamento/osmar-eventos--e203964",
    validationLevel: "C",
    contactStatus: "DIRECTORY_ONLY",
    services: ["DJ", "música para casamento"],
    notes: "Fornecedor relacionado exibido em ficha de música de casamento; preço de diretório desde R$890. A ficha própria, contato e pacote técnico precisam ser confirmados.",
  },
  {
    name: "Musiversos",
    category: "MUSIC",
    serviceArea: ["Búzios", "Região dos Lagos"],
    sourceUrl: "https://www.casamentos.com.br/musica-de-casamento/osmar-eventos--e203964",
    validationLevel: "C",
    contactStatus: "DIRECTORY_ONLY",
    services: ["DJ", "música para casamento"],
    notes: "Fornecedor relacionado exibido em ficha de música de casamento; base em Armação dos Búzios e preço de diretório desde R$1.500. Validar contato e serviços incluídos.",
  },
];
