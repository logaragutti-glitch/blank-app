// Seeds the Knowledge Graph with the concrete examples documented in
// docs/05-database-bible.md and docs/02-brand-bible.md, plus the
// Karen & Daniel / Villa Massari example that originated this project
// (see docs/03-product-spec.md).
import { PrismaPg } from "@prisma/adapter-pg";
import { MaterialCategory, PrismaClient, SupplierCategory } from "@prisma/client";

try {
  process.loadEnvFile(new URL("../.env", import.meta.url));
} catch {
  // .env is optional (e.g. when DATABASE_URL is provided by the shell/CI)
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const RESEARCH_SOURCES = {
  pinterest2026: "https://newsroom.pinterest.com/pt-br/news/wedding-trend-report-2026/",
  pinterest2025: "https://newsroom.pinterest.com/pt-br/news/the-annual-pinterest-wedding-trends-report/",
  knotGlobal2025: "https://www.theknotww.com/press-releases/the-knot-worldwides-2025-global-wedding-report-reveals-bold-new-era-of-personalization-and-purpose",
  knotMicro: "https://www.theknot.com/content/what-is-a-microwedding",
  knotDestination: "https://www.theknot.com/content/domestination-wedding-definition",
  knotRealWeddings: "https://www.theknot.com/content/wedding-data-insights/real-weddings-study",
  zola2025: "https://www.zola.com/expert-advice/the-first-look-report-2025",
  constanceZahn2026: "https://www.constancezahn.com/30-tendencias-de-decoracao-de-casamento-para-2026/",
} as const;

const researchedWeddingFormats = [
  {
    axis: "SCALE",
    slug: "elopement",
    name: "Elopement",
    description: "Cerimônia muito íntima, normalmente sem grupo de convidados ou com uma ou duas testemunhas, centrada na experiência do casal.",
    guestMin: 0,
    guestMax: 2,
    durationMinDays: 1,
    durationMaxDays: 1,
    travelRequired: false,
    ceremonyOnly: true,
    planningNotes: ["Confirmar requisitos legais e testemunhas do local", "Priorizar fotografia, celebrante e experiência do casal"],
    sourceUrls: [RESEARCH_SOURCES.knotMicro],
    sourceNotes: ["Definição editorial operacional; faixas de convidados não são universais nem legais."],
    evidence: { type: "editorial_definition", guestGuidance: "até 2 testemunhas conforme a legislação local" },
  },
  {
    axis: "SCALE",
    slug: "minimony",
    name: "Minimony",
    description: "Cerimônia curta e simples, geralmente com até dez pessoas, com foco no compromisso legal e possibilidade de recepção posterior.",
    guestMin: 0,
    guestMax: 10,
    durationMinDays: 1,
    durationMaxDays: 1,
    travelRequired: false,
    ceremonyOnly: true,
    planningNotes: ["Separar cerimônia legal de eventual festa futura", "Manter produção essencial e acolhedora"],
    sourceUrls: [RESEARCH_SOURCES.knotMicro],
    sourceNotes: ["Pode ser seguida por festa maior em outra data."],
    evidence: { type: "editorial_definition", guestGuidance: "normalmente até 10 pessoas" },
  },
  {
    axis: "SCALE",
    slug: "micro-wedding",
    name: "Micro-wedding",
    description: "Casamento completo em escala reduzida, com até cerca de 50 convidados e possibilidade de manter equipe e experiência de fornecedores.",
    guestMin: 2,
    guestMax: 50,
    durationMinDays: 1,
    durationMaxDays: 1,
    travelRequired: false,
    ceremonyOnly: false,
    planningNotes: ["Usar a escala para aprofundar detalhes e convivência", "Não presumir que menor número de convidados significa menor custo total"],
    sourceUrls: [RESEARCH_SOURCES.knotMicro],
    sourceNotes: ["A fonte descreve micro-wedding como até 50 convidados e distingue escala de orçamento."],
    evidence: { type: "editorial_definition", guestGuidance: "até 50 convidados" },
  },
  {
    axis: "SCALE",
    slug: "casamento-intimo",
    name: "Casamento íntimo / pequeno",
    description: "Celebração com grupo selecionado de familiares e amigos, mantendo cerimônia, recepção e experiência completa sem a escala de um grande evento.",
    guestMin: 10,
    guestMax: 100,
    durationMinDays: 1,
    durationMaxDays: 1,
    travelRequired: false,
    ceremonyOnly: false,
    planningNotes: ["Definir critérios de lista de convidados", "Concentrar investimento em hospitalidade, comida e conversa"],
    sourceUrls: [RESEARCH_SOURCES.knotMicro, RESEARCH_SOURCES.zola2025],
    sourceNotes: ["Eventos entre 50 e 100 convidados são tratados como pequenos em parte da literatura editorial."],
    evidence: { type: "editorial_definition", guestGuidance: "faixa orientativa de 10 a 100 convidados" },
  },
  {
    axis: "SCALE",
    slug: "casamento-tradicional",
    name: "Casamento tradicional / grande celebração",
    description: "Cerimônia e recepção com lista ampla de convidados, fornecedores completos e rituais tradicionais reinterpretados pelo casal.",
    guestMin: 80,
    guestMax: 300,
    durationMinDays: 1,
    durationMaxDays: 1,
    travelRequired: false,
    ceremonyOnly: false,
    planningNotes: ["Projetar fluxos de chegada, refeição, entretenimento e saída", "Personalizar rituais sem perder clareza operacional"],
    sourceUrls: [RESEARCH_SOURCES.zola2025, RESEARCH_SOURCES.knotGlobal2025],
    sourceNotes: ["A média e a escala variam por país; a faixa é uma convenção interna para planejamento."],
    evidence: { type: "planning_convention", guestGuidance: "faixa interna, não definição universal" },
  },
  {
    axis: "TRAVEL",
    slug: "destination-domestico",
    name: "Destination doméstico",
    description: "Casamento fora da cidade de origem, dentro do país, com deslocamento e geralmente hospedagem para parte dos convidados.",
    guestMin: 10,
    guestMax: 200,
    durationMinDays: 2,
    durationMaxDays: 4,
    travelRequired: true,
    ceremonyOnly: false,
    planningNotes: ["Planejar hospedagem, transporte, comunicação e atividades locais", "Considerar acessibilidade financeira para os convidados"],
    sourceUrls: [RESEARCH_SOURCES.knotDestination],
    sourceNotes: ["O destination doméstico é tratado como alternativa relevante ao casamento na cidade de origem."],
    evidence: { type: "survey_signal", shareOfDestinationCouplesIn2024: 0.82, sourceCaveat: "estimativa editorial derivada dos percentuais publicados pelo The Knot" },
  },
  {
    axis: "TRAVEL",
    slug: "destination-internacional",
    name: "Destination internacional",
    description: "Casamento fora do país de origem, com logística de viagem, documentação, fornecedores locais e experiência cultural para os convidados.",
    guestMin: 10,
    guestMax: 150,
    durationMinDays: 2,
    durationMaxDays: 5,
    travelRequired: true,
    ceremonyOnly: false,
    planningNotes: ["Validar legislação e documentação", "Contratar apoio local e comunicar custos de viagem com antecedência"],
    sourceUrls: [RESEARCH_SOURCES.knotDestination],
    sourceNotes: ["A fonte identifica destination wedding por deslocamento, não apenas por país ou clima."],
    evidence: { type: "editorial_definition", travelGuidance: "deslocamento para parte ou maioria dos envolvidos" },
  },
  {
    axis: "DURATION",
    slug: "wedding-weekend",
    name: "Wedding weekend / celebração de vários dias",
    description: "Experiência distribuída em dois ou mais dias, com boas-vindas, cerimônia, recepção e atividades de convivência ou descanso.",
    guestMin: 20,
    guestMax: 200,
    durationMinDays: 2,
    durationMaxDays: 4,
    travelRequired: false,
    ceremonyOnly: false,
    planningNotes: ["Criar uma jornada com momentos obrigatórios e tempo livre", "Coordenar hospedagem, alimentação, transporte e comunicação"],
    sourceUrls: [RESEARCH_SOURCES.knotDestination, RESEARCH_SOURCES.knotGlobal2025],
    sourceNotes: ["A tendência desloca o foco do evento único para experiência de fim de semana."],
    evidence: { type: "experience_format", durationGuidance: "dois ou mais dias" },
  },
  {
    axis: "SETTING",
    slug: "casamento-em-casa",
    name: "Casamento em casa",
    description: "Celebração realizada na casa do casal ou da família, usando memória, intimidade e arquitetura existente como parte da narrativa.",
    guestMin: 2,
    guestMax: 120,
    durationMinDays: 1,
    durationMaxDays: 2,
    travelRequired: false,
    ceremonyOnly: false,
    planningNotes: ["Mapear circulação, vizinhança, infraestrutura, energia e plano de chuva", "Proteger a intimidade e o patrimônio do espaço"],
    sourceUrls: [RESEARCH_SOURCES.pinterest2025],
    sourceNotes: ["Formato sustentado pelo caso editorial brasileiro de festa na casa da família."],
    evidence: { type: "editorial_case", geography: "Brasil" },
  },
  {
    axis: "SETTING",
    slug: "casamento-no-campo",
    name: "Casamento no campo / fazenda",
    description: "Celebração em ambiente rural ou de natureza, valorizando paisagem, flores sazonais, deslocamento interno e convivência ao ar livre.",
    guestMin: 10,
    guestMax: 200,
    durationMinDays: 1,
    durationMaxDays: 3,
    travelRequired: false,
    ceremonyOnly: false,
    planningNotes: ["Avaliar piso, clima, energia, banheiros e acessibilidade", "Criar plano B para chuva e temperatura"],
    sourceUrls: [RESEARCH_SOURCES.pinterest2025, RESEARCH_SOURCES.zola2025],
    sourceNotes: ["A fonte brasileira apresenta cerimônia íntima em fazenda e flores silvestres; garden party aparece como vibe recorrente."],
    evidence: { type: "editorial_case_and_trend", geography: "Brasil e internacional" },
  },
  {
    axis: "SETTING",
    slug: "casamento-na-praia",
    name: "Casamento na praia",
    description: "Celebração costeira que integra paisagem, luz, vento, areia e mar à experiência, exigindo planejamento ambiental e operacional específico.",
    guestMin: 10,
    guestMax: 200,
    durationMinDays: 1,
    durationMaxDays: 3,
    travelRequired: false,
    ceremonyOnly: false,
    planningNotes: ["Validar maré, vento, sombra, acessibilidade e licenças", "Usar materiais resistentes e plano de chuva"],
    sourceUrls: [RESEARCH_SOURCES.constanceZahn2026, RESEARCH_SOURCES.knotDestination],
    sourceNotes: ["A praia aparece como cenário de altares esculturais e destination, mas não deve ser reduzida a estética tropical."],
    evidence: { type: "editorial_trend", geography: "Brasil e internacional" },
  },
] as const;

const researchedWeddingTrends = [
  {
    slug: "personalizacao-autoral",
    name: "Personalização autoral",
    category: "EXPERIENCE",
    description: "Detalhes, rituais e escolhas que tornam a celebração reconhecível como pertencente ao casal.",
    applicationNotes: ["Traduzir história, valores e repertório do casal em decisões visíveis", "Evitar copiar referências sem adaptação"],
    productionConsiderations: ["Validar quais escolhas são executáveis no orçamento e no espaço", "Registrar decisões aprovadas no briefing"],
    paletteColors: [],
    materials: [],
    sourceUrls: [RESEARCH_SOURCES.knotGlobal2025, RESEARCH_SOURCES.pinterest2026, RESEARCH_SOURCES.zola2025],
    sourceNotes: ["The Knot: 68% querem uma experiência diferente de outros casamentos; detalhes personalizados lideram memorabilidade com 36%."],
    evidence: { type: "survey_signal", values: { distinctGuestExperience: 0.68, memorablePersonalDetails: 0.36 } },
    sourceDate: new Date("2025-08-14"),
    geography: "Global / amostra internacional",
  },
  {
    slug: "experiencia-do-convidado",
    name: "Experiência do convidado",
    category: "EXPERIENCE",
    description: "Planejamento que trata o convidado como participante da jornada, não apenas como espectador da cerimônia.",
    applicationNotes: ["Criar acolhimento, conforto, ritmo, alimentação e momentos de descoberta", "Personalizar atividades para o contexto do destino"],
    productionConsiderations: ["Mapear acessibilidade, deslocamentos, alimentação e tempo livre", "Evitar excesso de programação"],
    paletteColors: [],
    materials: [],
    sourceUrls: [RESEARCH_SOURCES.knotGlobal2025, RESEARCH_SOURCES.knotDestination],
    sourceNotes: ["Os relatórios destacam conexão, hospitalidade e experiências de fim de semana."],
    evidence: { type: "editorial_and_survey_signal" },
    sourceDate: new Date("2025-08-14"),
    geography: "Global / amostras internacionais",
  },
  {
    slug: "sustentabilidade-pratica",
    name: "Sustentabilidade prática",
    category: "OPERATIONS",
    description: "Escolhas conscientes de sourcing, reuso, logística e materiais sem transformar sustentabilidade em adjetivo vazio.",
    applicationNotes: ["Priorizar fornecedores locais, flores de estação, reuso e materiais duráveis", "Explicar o impacto e os trade-offs de cada decisão"],
    productionConsiderations: ["Planejar transporte, descarte, energia e desmontagem", "Não prometer impacto ambiental sem evidência"],
    paletteColors: ["verde oliva", "terra", "neutros naturais"],
    materials: ["flores de estação", "materiais reutilizáveis", "tecidos naturais"],
    sourceUrls: [RESEARCH_SOURCES.zola2025, RESEARCH_SOURCES.knotDestination],
    sourceNotes: ["Zola informa que 17% dos casais pesquisados fazem garimpo ou sourcing sustentável."],
    evidence: { type: "survey_signal", sustainableSourcing: 0.17 },
    sourceDate: new Date("2026-01-26"),
    geography: "EUA / amostra Zola",
  },
  {
    slug: "garden-party",
    name: "Garden party",
    category: "AESTHETIC",
    description: "Atmosfera de jardim acolhedor, com natureza próxima, convivência informal e elegância leve.",
    applicationNotes: ["Usar paisagem, mesas ao ar livre e florais orgânicos", "Equilibrar naturalidade com conforto e plano de chuva"],
    productionConsiderations: ["Validar terreno, sombra, energia, insetos e circulação", "Criar iluminação de transição entre dia e noite"],
    paletteColors: ["verde sálvia", "branco", "rosa queimado", "amarelo suave"],
    materials: ["linho", "madeira clara", "flores de estação", "fibra natural"],
    sourceUrls: [RESEARCH_SOURCES.zola2025],
    sourceNotes: ["Garden party lidera como vibe e venue no relatório Zola pelo segundo ano."],
    evidence: { type: "survey_signal" },
    sourceDate: new Date("2026-01-26"),
    geography: "EUA / amostra Zola",
  },
  {
    slug: "natureza-romantica",
    name: "Natureza romântica",
    category: "PALETTE",
    description: "Paletas terrosas e botânicas com profundidade romântica, incluindo ameixa, merlot, figo, oliva, terracota e rosa queimado.",
    applicationNotes: ["Combinar tons orgânicos com materiais táteis", "Usar a paleta como atmosfera, não como receita fixa"],
    productionConsiderations: ["Testar fidelidade de cor em luz natural e artificial", "Relacionar flores e tecidos à estação"],
    paletteColors: ["ameixa", "merlot", "figo", "verde oliva", "terracota suave", "rosa queimado", "framboesa"],
    materials: ["flores de estação", "linho", "madeira", "cerâmica"],
    sourceUrls: [RESEARCH_SOURCES.pinterest2026],
    sourceNotes: ["Pinterest 2026 reporta sinais de busca crescentes para ameixa/oliva, figo, merlot, terracota e rosa queimado."],
    evidence: { type: "search_signal", values: { plumOlive: 13.8, plumTheme: 6.3, fig: 5.15, merlot: 3.7, softTerracotta: 5.45 } },
    sourceDate: new Date("2026-04-28"),
    geography: "Global / buscas Pinterest",
  },
  {
    slug: "brilho-etereo",
    name: "Brilho etéreo",
    category: "PALETTE",
    description: "Paleta de opalescentes, iridescentes, cromados, pastéis etéreos e tons de joia para uma atmosfera quase cinematográfica.",
    applicationNotes: ["Usar brilho como acento e camada de luz", "Equilibrar superfícies reflexivas com materiais foscos"],
    productionConsiderations: ["Testar reflexos em fotografia e vídeo", "Controlar excesso de cromado e fontes de luz duras"],
    paletteColors: ["opalina", "lilás", "malva", "azul meia-noite", "cromado", "rosa pastel"],
    materials: ["vidro", "metal cromado", "tecidos translúcidos", "pérolas"],
    sourceUrls: [RESEARCH_SOURCES.pinterest2026, RESEARCH_SOURCES.pinterest2025],
    sourceNotes: ["Pinterest 2026 destaca estética opalita/opalescente e cromado; Pinterest 2025 reforça toques pessoais e cores vibrantes."],
    evidence: { type: "search_signal", values: { opalAesthetic: 27.1, opalescentAesthetic: 6.85, chromeWedding: 3.4 } },
    sourceDate: new Date("2026-04-28"),
    geography: "Global / buscas Pinterest",
  },
  {
    slug: "marrom-chocolate-terroso",
    name: "Marrom chocolate e terrosos",
    category: "PALETTE",
    description: "Marrom, chocolate, mocha e terrosos criando acolhimento, sofisticação e calor visual.",
    applicationNotes: ["Aplicar em flores, papelaria, trajes, mobiliário e tecidos", "Combinar com off-white, verde ou metálicos conforme a atmosfera"],
    productionConsiderations: ["Verificar leitura da paleta em ambientes escuros", "Evitar que o marrom reduza contraste ou pareça monótono"],
    paletteColors: ["chocolate", "mocha", "cacau", "caramelo", "off-white"],
    materials: ["madeira", "couro", "veludo", "cerâmica"],
    sourceUrls: [RESEARCH_SOURCES.pinterest2025],
    sourceNotes: ["Pinterest Brasil 2025 apresenta marrom/chocolate como tom emergente para decoração, flores e trajes."],
    evidence: { type: "editorial_signal", geography: "Brasil / Pinterest em português" },
    sourceDate: new Date("2025-04-29"),
    geography: "Brasil / editorial Pinterest",
  },
  {
    slug: "cloud-dancer-monocromia-eterea",
    name: "Cloud Dancer e monocromia etérea",
    category: "PALETTE",
    description: "Branco etéreo, volumes suaves, tecidos fluidos e atmosfera de nuvem como interpretação contemporânea do monocromático.",
    applicationNotes: ["Trabalhar camadas de off-white, marfim e baunilha", "Criar volume por tecido, transparência e luz suave"],
    productionConsiderations: ["Diferenciar tons claros para não perder profundidade", "Testar sujeira, manutenção e leitura em fotografia"],
    paletteColors: ["Cloud Dancer", "off-white", "marfim", "baunilha"],
    materials: ["tecidos fluidos", "organza", "linho", "materiais translúcidos"],
    sourceUrls: [RESEARCH_SOURCES.constanceZahn2026],
    sourceNotes: ["A fonte editorial brasileira relaciona Cloud Dancer a monocromia, tecidos, transparência e atmosfera etérea."],
    evidence: { type: "editorial_signal", pantoneReference: "Cloud Dancer 2026" },
    sourceDate: new Date("2026-01-27"),
    geography: "Brasil / editorial Constance Zahn",
  },
  {
    slug: "artsy-surrealista",
    name: "Artsy e surrealista",
    category: "AESTHETIC",
    description: "Direção artística que aproxima a decoração de uma exposição, com composições inesperadas, cor e instalações autorais.",
    applicationNotes: ["Construir uma ideia central antes de escolher objetos", "Usar contraste e escala para criar narrativa visual"],
    productionConsiderations: ["Validar estruturas, segurança, montagem e fotografia", "Limitar o número de gestos para preservar leitura"],
    paletteColors: ["vermelho", "amarelo", "azul intenso", "verde escuro"],
    materials: ["estruturas escultóricas", "objetos de prata", "tecidos", "frutas e legumes"],
    sourceUrls: [RESEARCH_SOURCES.constanceZahn2026],
    sourceNotes: ["Constance Zahn descreve a passagem para estética artsy/avant-garde e arranjos como linguagem autoral."],
    evidence: { type: "editorial_signal" },
    sourceDate: new Date("2026-01-27"),
    geography: "Brasil / editorial Constance Zahn",
  },
  {
    slug: "maximalismo-editorial",
    name: "Maximalismo editorial",
    category: "AESTHETIC",
    description: "Abundância deliberada de cor, volume, camadas e objetos para transformar o espaço em cenário de impacto.",
    applicationNotes: ["Escolher uma hierarquia de volumes e pontos focais", "Usar repetição e contraste em vez de acúmulo aleatório"],
    productionConsiderations: ["Controlar orçamento, armazenamento, montagem e retirada", "Garantir rotas de circulação e conforto dos convidados"],
    paletteColors: ["vermelho", "amarelo", "verde escuro", "rosa intenso"],
    materials: ["drapeados", "flores abundantes", "prata", "luminárias"],
    sourceUrls: [RESEARCH_SOURCES.constanceZahn2026],
    sourceNotes: ["Maximalismo aparece entre as tendências de 2025 que a fonte brasileira vê firmes em 2026."],
    evidence: { type: "editorial_signal" },
    sourceDate: new Date("2026-01-27"),
    geography: "Brasil / editorial Constance Zahn",
  },
  {
    slug: "naturalismo-moderno",
    name: "Naturalismo moderno",
    category: "AESTHETIC",
    description: "Natureza interpretada com direção contemporânea, valorizando textura, paisagem e assimetria sem parecer rústico por padrão.",
    applicationNotes: ["Usar capim, folhagens, flores de estação e materiais naturais", "Combinar espontaneidade com desenho de composição"],
    productionConsiderations: ["Verificar sazonalidade e disponibilidade local", "Planejar resistência de materiais e descarte"],
    paletteColors: ["verde oliva", "verde escuro", "palha", "branco"],
    materials: ["capim", "folhagens", "madeira", "fibra natural"],
    sourceUrls: [RESEARCH_SOURCES.constanceZahn2026, RESEARCH_SOURCES.pinterest2025],
    sourceNotes: ["Naturalismo moderno e flores silvestres aparecem em fontes brasileiras como linguagem contemporânea."],
    evidence: { type: "editorial_signal" },
    sourceDate: new Date("2026-01-27"),
    geography: "Brasil / editorial",
  },
  {
    slug: "florais-autoriais-instalacoes",
    name: "Florais autorais e instalações",
    category: "FLORAL",
    description: "Flores tratadas como gesto, volume e instalação, não apenas como arranjo em vaso visível.",
    applicationNotes: ["Criar peças com leitura espacial e conexão com o conceito", "Combinar florais com arquitetura, mesa e fotografia"],
    productionConsiderations: ["Validar estrutura, hidratação, transporte, montagem e desmontagem", "Priorizar espécies disponíveis e adequadas ao clima"],
    paletteColors: ["monocromático", "mezzo branco e verde", "cores intensas"],
    materials: ["flores de estação", "estruturas tubulares", "vasos ocultos", "frutas e legumes"],
    sourceUrls: [RESEARCH_SOURCES.constanceZahn2026],
    sourceNotes: ["A fonte destaca instalações, arranjos plantados, frutas/legumes e florais menos decorativos e mais autorais."],
    evidence: { type: "editorial_signal" },
    sourceDate: new Date("2026-01-27"),
    geography: "Brasil / editorial Constance Zahn",
  },
  {
    slug: "arquitetura-escultorica",
    name: "Arquitetura e altares escultóricos",
    category: "ARCHITECTURE",
    description: "Arquitetura, altar e estruturas como protagonistas da narrativa, com presença formal e impacto visual.",
    applicationNotes: ["Projetar altar e estruturas a partir do espaço real", "Usar tecido, espelho, curvas, módulos ou geometrias como linguagem"],
    productionConsiderations: ["Validar carga, fixação, vento, energia, licenças e acessibilidade", "Produzir desenho técnico e plano de montagem"],
    paletteColors: ["branco", "verde escuro", "azul intenso", "prata"],
    materials: ["tecido", "espelho", "metal", "estruturas orgânicas"],
    sourceUrls: [RESEARCH_SOURCES.constanceZahn2026],
    sourceNotes: ["A arquitetura como narrativa e altares escultóricos são eixos centrais do artigo brasileiro de 2026."],
    evidence: { type: "editorial_signal" },
    sourceDate: new Date("2026-01-27"),
    geography: "Brasil / editorial Constance Zahn",
  },
  {
    slug: "banquete-experiencial",
    name: "Banquete e gastronomia como experiência",
    category: "GASTRONOMY",
    description: "Comida, bebida e montagem da mesa assumem papel narrativo, social e cenográfico na celebração.",
    applicationNotes: ["Criar serviço coerente com ritmo e identidade do casal", "Usar instalações gastronômicas, banquetes ou mesa comunitária quando fizer sentido"],
    productionConsiderations: ["Validar temperatura, fluxo, restrições alimentares, equipe e reposição", "Separar impacto visual de segurança alimentar"],
    paletteColors: [],
    materials: ["prata", "cerâmica", "linho", "frutas e legumes"],
    sourceUrls: [RESEARCH_SOURCES.knotGlobal2025, RESEARCH_SOURCES.constanceZahn2026],
    sourceNotes: ["The Knot coloca comida e bebidas como segundo fator de memorabilidade (23%); Constance Zahn destaca banquetes e instalações gastronômicas."],
    evidence: { type: "survey_and_editorial_signal", memorableFoodAndDrinks: 0.23 },
    sourceDate: new Date("2026-01-27"),
    geography: "Global / Brasil",
  },
  {
    slug: "votos-privados",
    name: "Votos privados",
    category: "CEREMONY",
    description: "Troca de votos em momento reservado, antes ou durante a celebração, priorizando intimidade e significado.",
    applicationNotes: ["Oferecer opção de votos privados sem retirar emoção da cerimônia pública", "Criar cenário e tempo protegido para o casal"],
    productionConsiderations: ["Alinhar celebrante, fotografia, cronograma e privacidade", "Registrar preferência no briefing"],
    paletteColors: [],
    materials: [],
    sourceUrls: [RESEARCH_SOURCES.zola2025],
    sourceNotes: ["Zola destaca private vow exchanges como escolha em alta."],
    evidence: { type: "editorial_report_signal" },
    sourceDate: new Date("2026-01-26"),
    geography: "EUA / amostra Zola",
  },
  {
    slug: "vintage-e-multiplos-looks",
    name: "Vintage e múltiplos looks",
    category: "FASHION",
    description: "Vestidos vintage, referências de décadas passadas e trocas de look como parte da narrativa do casal.",
    applicationNotes: ["Relacionar o look à história, à família e ao local", "Planejar transições sem quebrar o ritmo da celebração"],
    productionConsiderations: ["Prever assistência, armazenamento, tempo de troca e fotografia", "Validar conservação de peças antigas"],
    paletteColors: ["marfim", "champagne", "marrom"],
    materials: ["renda", "pérolas", "tecidos vintage"],
    sourceUrls: [RESEARCH_SOURCES.pinterest2025],
    sourceNotes: ["Pinterest Brasil destaca vestidos dos anos 1990, vintage e múltiplos looks no caso editorial apresentado."],
    evidence: { type: "editorial_signal", geography: "Brasil / Pinterest em português" },
    sourceDate: new Date("2025-04-29"),
    geography: "Brasil / editorial Pinterest",
  },
  {
    slug: "conteudo-social-autentico",
    name: "Conteúdo social autêntico",
    category: "TECHNOLOGY",
    description: "Registro vertical, bastidores e conteúdo imediato para redes sociais, sem deixar que a performance digital domine a celebração.",
    applicationNotes: ["Definir linguagem, limites de publicação e momentos prioritários", "Valorizar espontaneidade e consentimento"],
    productionConsiderations: ["Planejar cobertura, privacidade, direitos de imagem e fluxo de arquivos", "Evitar interferência da equipe na experiência"],
    paletteColors: [],
    materials: [],
    sourceUrls: [RESEARCH_SOURCES.zola2025],
    sourceNotes: ["Zola informa que 21% planejam conteúdo específico para redes e 68% avaliam fornecedores por redes sociais."],
    evidence: { type: "survey_signal", socialSpecificContent: 0.21, vendorVettingOnSocial: 0.68 },
    sourceDate: new Date("2026-01-26"),
    geography: "EUA / amostra Zola",
  },
  {
    slug: "ia-na-decoracao",
    name: "IA como ferramenta de concepção",
    category: "TECHNOLOGY",
    description: "Uso de IA para explorar alternativas visuais, acelerar moodboards e apoiar decisões, mantendo curadoria humana e viabilidade real.",
    applicationNotes: ["Usar IA para explorar, não para prometer execução", "Registrar premissas e revisar materiais, escala, segurança e custo"],
    productionConsiderations: ["Separar imagem conceitual de projeto executivo", "Sinalizar quando uma imagem for gerada por IA"],
    paletteColors: [],
    materials: [],
    sourceUrls: [RESEARCH_SOURCES.zola2025, RESEARCH_SOURCES.constanceZahn2026, RESEARCH_SOURCES.knotRealWeddings],
    sourceNotes: ["Zola e Constance Zahn mencionam IA no planejamento/decoração; The Knot Real Weddings descreve novas ferramentas de planejamento com IA."],
    evidence: { type: "editorial_and_market_signal" },
    sourceDate: new Date("2026-02-17"),
    geography: "Global / amostras e editoriais internacionais",
  },
  {
    slug: "speakeasy-e-ambientes-depois-da-festa",
    name: "Speakeasy e ambientes de transição",
    category: "SETTING",
    description: "Espaços de recepção com atmosfera mais íntima, teatral e noturna, como lounges, bares escondidos e after parties.",
    applicationNotes: ["Criar mudança de atmosfera ao longo do evento", "Usar iluminação, som, mobiliário e sinalização para conduzir o convidado"],
    productionConsiderations: ["Validar capacidade, segurança, acústica e operação do bar", "Planejar transição sem desorientar pessoas com acessibilidade"],
    paletteColors: ["vinho", "ameixa", "preto", "cromado"],
    materials: ["veludo", "metal", "vidro", "luz baixa"],
    sourceUrls: [RESEARCH_SOURCES.pinterest2026],
    sourceNotes: ["Pinterest 2026 destaca espaços com estética speakeasy e celebrações cinematográficas."],
    evidence: { type: "editorial_signal" },
    sourceDate: new Date("2026-04-28"),
    geography: "Global / Pinterest",
  },
  {
    slug: "pre-festa-intima",
    name: "Pré-festa e boas-vindas íntimas",
    category: "EXPERIENCE",
    description: "Encontros discretos antes do casamento, como jantar, welcome drinks ou reunião de poucos convidados, para construir a jornada.",
    applicationNotes: ["Escolher uma atividade que tenha sentido para o casal", "Manter a pré-festa simples e complementar ao evento principal"],
    productionConsiderations: ["Definir lista, local, transporte e orçamento separado", "Comunicar claramente o que é opcional ou parte do convite"],
    paletteColors: [],
    materials: [],
    sourceUrls: [RESEARCH_SOURCES.pinterest2026, RESEARCH_SOURCES.knotDestination],
    sourceNotes: ["Pinterest 2026 destaca pré-festas discretas; The Knot relaciona destination a experiências de fim de semana."],
    evidence: { type: "editorial_signal" },
    sourceDate: new Date("2026-04-28"),
    geography: "Global / editorial",
  },
] as const;

const weddingFormatTrendLinks = [
  ["elopement", ["personalizacao-autoral", "sustentabilidade-pratica", "natureza-romantica", "brilho-etereo", "cloud-dancer-monocromia-eterea", "votos-privados", "vintage-e-multiplos-looks"]],
  ["minimony", ["personalizacao-autoral", "sustentabilidade-pratica", "cloud-dancer-monocromia-eterea", "votos-privados", "pre-festa-intima"]],
  ["micro-wedding", ["personalizacao-autoral", "experiencia-do-convidado", "sustentabilidade-pratica", "garden-party", "natureza-romantica", "banquete-experiencial", "votos-privados", "conteudo-social-autentico"]],
  ["casamento-intimo", ["personalizacao-autoral", "experiencia-do-convidado", "sustentabilidade-pratica", "brilho-etereo", "artsy-surrealista", "naturalismo-moderno", "banquete-experiencial", "votos-privados", "speakeasy-e-ambientes-depois-da-festa"]],
  ["casamento-tradicional", ["personalizacao-autoral", "experiencia-do-convidado", "garden-party", "brilho-etereo", "marrom-chocolate-terroso", "maximalismo-editorial", "florais-autoriais-instalacoes", "arquitetura-escultorica", "banquete-experiencial", "conteudo-social-autentico", "ia-na-decoracao"]],
  ["destination-domestico", ["personalizacao-autoral", "experiencia-do-convidado", "sustentabilidade-pratica", "natureza-romantica", "florais-autoriais-instalacoes", "arquitetura-escultorica", "banquete-experiencial", "conteudo-social-autentico", "pre-festa-intima"]],
  ["destination-internacional", ["personalizacao-autoral", "experiencia-do-convidado", "sustentabilidade-pratica", "brilho-etereo", "artsy-surrealista", "florais-autoriais-instalacoes", "arquitetura-escultorica", "banquete-experiencial", "conteudo-social-autentico", "pre-festa-intima"]],
  ["wedding-weekend", ["personalizacao-autoral", "experiencia-do-convidado", "sustentabilidade-pratica", "maximalismo-editorial", "florais-autoriais-instalacoes", "banquete-experiencial", "conteudo-social-autentico", "speakeasy-e-ambientes-depois-da-festa", "pre-festa-intima"]],
  ["casamento-em-casa", ["personalizacao-autoral", "sustentabilidade-pratica", "garden-party", "marrom-chocolate-terroso", "cloud-dancer-monocromia-eterea", "naturalismo-moderno", "vintage-e-multiplos-looks", "banquete-experiencial", "ia-na-decoracao"]],
  ["casamento-no-campo", ["personalizacao-autoral", "experiencia-do-convidado", "sustentabilidade-pratica", "garden-party", "natureza-romantica", "naturalismo-moderno", "florais-autoriais-instalacoes", "banquete-experiencial", "votos-privados"]],
  ["casamento-na-praia", ["personalizacao-autoral", "experiencia-do-convidado", "sustentabilidade-pratica", "brilho-etereo", "naturalismo-moderno", "florais-autoriais-instalacoes", "arquitetura-escultorica", "conteudo-social-autentico", "pre-festa-intima"]],
] as const;

async function seedWeddingKnowledgeCatalog(tenantId: string, organizationId: string) {
  const formatIds = new Map<string, string>();
  for (const format of researchedWeddingFormats) {
    const formatData = {
      ...format,
      planningNotes: [...format.planningNotes],
      sourceUrls: [...format.sourceUrls],
      sourceNotes: [...format.sourceNotes],
    };
    const row = await prisma.weddingFormat.upsert({
      where: { organizationId_slug: { organizationId, slug: format.slug } },
      update: formatData,
      create: { tenantId, organizationId, ...formatData },
    });
    formatIds.set(format.slug, row.id);
  }

  const trendIds = new Map<string, string>();
  for (const trend of researchedWeddingTrends) {
    const trendData = {
      ...trend,
      applicationNotes: [...trend.applicationNotes],
      productionConsiderations: [...trend.productionConsiderations],
      paletteColors: [...trend.paletteColors],
      materials: [...trend.materials],
      sourceUrls: [...trend.sourceUrls],
      sourceNotes: [...trend.sourceNotes],
    };
    const row = await prisma.weddingTrend.upsert({
      where: { organizationId_slug: { organizationId, slug: trend.slug } },
      update: trendData,
      create: { tenantId, organizationId, ...trendData },
    });
    trendIds.set(trend.slug, row.id);
  }

  for (const [formatSlug, trendSlugs] of weddingFormatTrendLinks) {
    const formatId = formatIds.get(formatSlug);
    if (!formatId) throw new Error(`Unknown wedding format slug: ${formatSlug}`);
    for (const trendSlug of trendSlugs) {
      const trendId = trendIds.get(trendSlug);
      if (!trendId) throw new Error(`Unknown wedding trend slug: ${trendSlug}`);
      await prisma.weddingFormatTrend.upsert({
        where: { formatId_trendId: { formatId, trendId } },
        update: { fitScore: 3, rationale: "Compatibilidade editorial inicial; validar no briefing, orçamento, espaço e logística." },
        create: { formatId, trendId, fitScore: 3, rationale: "Compatibilidade editorial inicial; validar no briefing, orçamento, espaço e logística." },
      });
    }
  }

  console.log(`Catálogo de casamentos: ${researchedWeddingFormats.length} formatos, ${researchedWeddingTrends.length} tendências e ${weddingFormatTrendLinks.reduce((total, [, trends]) => total + trends.length, 0)} relações.`);
}

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Tia Bia Festas",
    },
  });

  const organization = await prisma.organization.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      tenantId: tenant.id,
      name: "Tia Bia Festas",
    },
  });

  const tenantId = tenant.id;
  const organizationId = organization.id;

  // --- Knowledge Graph: estilos --------------------------------------------

  const gardenFineArt = await prisma.eventStyle.upsert({
    where: { organizationId_name: { organizationId, name: "Garden Fine Art" } },
    update: {},
    create: {
      tenantId,
      organizationId,
      name: "Garden Fine Art",
      // Scores de exemplo documentados em 05-database-bible.md; a sessão
      // original não vinculou explicitamente os dois valores a um estilo
      // nomeado — atribuídos aqui ao Garden Fine Art por ser o único
      // estilo detalhado com ficha completa no material recebido.
      dimensionScores: { Luxuoso: 8.0, Natural: 7.8 },
      paletteColors: ["rosé", "verde sálvia", "champagne"],
      furnitureNotes: ["madeira clara", "ferro branco"],
      loungeNotes: ["fibra natural", "linho"],
    },
  });

  // Estilos citados apenas como "incompatível com" na ficha da Peônia,
  // sem ficha própria documentada — criados como placeholders mínimos
  // para que a relação de incompatibilidade seja representável e
  // consultável, sem inventar pontuações que não foram documentadas.
  const [futurista, industrial] = await Promise.all([
    prisma.eventStyle.upsert({
      where: { organizationId_name: { organizationId, name: "Futurista" } },
      update: {},
      create: { tenantId, organizationId, name: "Futurista", dimensionScores: {} },
    }),
    prisma.eventStyle.upsert({
      where: { organizationId_name: { organizationId, name: "Industrial" } },
      update: {},
      create: { tenantId, organizationId, name: "Industrial", dimensionScores: {} },
    }),
  ]);

  // --- Knowledge Graph: materiais -------------------------------------------

  await prisma.material.upsert({
    where: { organizationId_name: { organizationId, name: "Peônia" } },
    update: {},
    create: {
      tenantId,
      organizationId,
      name: "Peônia",
      category: MaterialCategory.FLOWER,
      emotions: ["Romance", "Abundância", "Delicadeza"],
      seasons: ["Primavera"],
      // Custo estimado por buquê médio (BRL) — usado pelo Agente 4
      // (04-ai-bible.md) para orçamento/margem.
      estimatedUnitCost: 45,
      compatibleStyles: { connect: [{ id: gardenFineArt.id }] },
      incompatibleStyles: { connect: [{ id: futurista.id }, { id: industrial.id }] },
    },
  });

  await prisma.material.upsert({
    where: { organizationId_name: { organizationId, name: "Lisianthus" } },
    update: {},
    create: {
      tenantId,
      organizationId,
      name: "Lisianthus",
      category: MaterialCategory.FLOWER,
      emotions: [],
      seasons: [],
      compatibleStyles: { connect: [{ id: gardenFineArt.id }] },
    },
  });

  await prisma.material.upsert({
    where: { organizationId_name: { organizationId, name: "Rosa Inglesa" } },
    update: {},
    create: {
      tenantId,
      organizationId,
      name: "Rosa Inglesa",
      category: MaterialCategory.FLOWER,
      emotions: [],
      seasons: [],
      compatibleStyles: { connect: [{ id: gardenFineArt.id }] },
    },
  });

  // A Bia sempre troca Tulipas por Lisianthus (04-ai-bible.md) — mantida no
  // catálogo para que esse padrão de aprendizado seja consultável/rastreável,
  // sem vínculo de compatibilidade de estilo (está sendo deliberadamente
  // substituída, não recomendada ativamente).
  await prisma.material.upsert({
    where: { organizationId_name: { organizationId, name: "Tulipa" } },
    update: {},
    create: {
      tenantId,
      organizationId,
      name: "Tulipa",
      category: MaterialCategory.FLOWER,
      emotions: [],
      seasons: [],
    },
  });

  for (const name of ["Gaze", "Organza", "Linho"]) {
    await prisma.material.upsert({
      where: { organizationId_name: { organizationId, name } },
      update: {},
      create: {
        tenantId,
        organizationId,
        name,
        category: MaterialCategory.FABRIC,
        emotions: [],
        seasons: [],
        compatibleStyles: { connect: [{ id: gardenFineArt.id }] },
      },
    });
  }

  for (const name of ["Madeira Clara", "Ferro Branco", "Fibra Natural"]) {
    await prisma.material.upsert({
      where: { organizationId_name: { organizationId, name } },
      update: {},
      create: {
        tenantId,
        organizationId,
        name,
        category: MaterialCategory.FURNITURE,
        emotions: [],
        seasons: [],
        compatibleStyles: { connect: [{ id: gardenFineArt.id }] },
      },
    });
  }

  // Lista "Não utilizar" (05-database-bible.md) — nunca devem ser sugeridos.
  await prisma.material.upsert({
    where: { organizationId_name: { organizationId, name: "Neon" } },
    update: {},
    create: {
      tenantId,
      organizationId,
      name: "Neon",
      category: MaterialCategory.LIGHTING,
      emotions: [],
      seasons: [],
      neverRecommend: true,
    },
  });

  await prisma.material.upsert({
    where: { organizationId_name: { organizationId, name: "Acrílico Colorido" } },
    update: {},
    create: {
      tenantId,
      organizationId,
      name: "Acrílico Colorido",
      category: MaterialCategory.OTHER,
      emotions: [],
      seasons: [],
      neverRecommend: true,
    },
  });

  await prisma.material.upsert({
    where: { organizationId_name: { organizationId, name: "LED RGB" } },
    update: {},
    create: {
      tenantId,
      organizationId,
      name: "LED RGB",
      category: MaterialCategory.LIGHTING,
      emotions: [],
      seasons: [],
      neverRecommend: true,
    },
  });

  await seedWeddingKnowledgeCatalog(tenantId, organizationId);

  // --- Venue: Villa Massari --------------------------------------------------

  const villaMassari = await prisma.venue.upsert({
    where: { organizationId_name: { organizationId, name: "Villa Massari" } },
    update: {},
    create: {
      tenantId,
      organizationId,
      name: "Villa Massari",
      recommendationNotes: [
        "cerimônia externa",
        "aproveitar a arquitetura",
        "iluminação quente",
        "flores em tons suaves",
      ],
    },
  });

  // --- Fornecedor preferencial da Villa Massari -------------------------------

  await prisma.supplier.upsert({
    where: { organizationId_name: { organizationId, name: "Flores da Serra" } },
    update: {},
    create: {
      tenantId,
      organizationId,
      name: "Flores da Serra",
      category: SupplierCategory.FLORIST,
      performanceNotes: "Entrega sempre pontual, bom custo-benefício para flores de estação.",
      // Custo estimado para contratação num evento típico (BRL) — usado
      // pelo Agente 4 (04-ai-bible.md) para orçamento/custo-benefício.
      estimatedCost: 3800,
      venues: { create: [{ venueId: villaMassari.id, notes: "Fornecedor preferencial para cerimônias externas." }] },
    },
  });

  await prisma.supplier.upsert({
    where: { organizationId_name: { organizationId, name: "Equipe Raiz Montagens" } },
    update: {},
    create: {
      tenantId,
      organizationId,
      name: "Equipe Raiz Montagens",
      category: SupplierCategory.ASSEMBLY_CREW,
      performanceNotes: "Equipe experiente com o terreno irregular da Villa Massari, monta e desmonta no mesmo dia.",
      // Custo estimado de mão de obra (montagem + desmontagem, BRL) para um
      // evento típico — usado pelo Agente 4 para orçamento/custo-benefício,
      // mesmo mecanismo já usado para as demais categorias de fornecedor.
      estimatedCost: 2400,
      venues: { create: [{ venueId: villaMassari.id, notes: "Equipe preferencial pela familiaridade com o espaço." }] },
    },
  });

  // --- Cliente e evento de origem: Karen & Daniel -----------------------------
  // O orçamento real que originou este projeto (docs/README.md, seção "Origem").

  let karenAndDaniel = await prisma.client.findFirst({
    where: { organizationId, partnerOneName: "Karen", partnerTwoName: "Daniel" },
  });
  if (!karenAndDaniel) {
    karenAndDaniel = await prisma.client.create({
      data: {
        tenantId,
        organizationId,
        partnerOneName: "Karen",
        partnerTwoName: "Daniel",
      },
    });
  }

  const existingEvent = await prisma.event.findFirst({
    where: { organizationId, clientId: karenAndDaniel.id, venueId: villaMassari.id },
  });
  if (!existingEvent) {
    await prisma.event.create({
      data: {
        tenantId,
        organizationId,
        clientId: karenAndDaniel.id,
        venueId: villaMassari.id,
        guestsExpected: 100,
        ceremonyDateTime: new Date("2027-08-07T16:30:00Z"),
        budgetAmount: 26770.0,
      },
    });
  }

  console.log("Seed concluído.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
