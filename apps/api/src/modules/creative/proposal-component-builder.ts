import type { Client, DiagnosticoCriativo, Event, Venue } from "@eve-os/types";
import type { UpsertProposalComponentInput } from "./repositories/proposal-component.repository";
import type { ProposalComponentsResult } from "./ai/proposal-components.port";

// Order matches the sequence of Capitulo 7 (03-product-spec.md): Capa >
// Historia da Bia > Historia do casal > Conceito > Moodboard > Paleta >
// Entrada > Cerimonia > Mesa do bolo > Lounge > Mesas dos convidados > Bar >
// Buffet > Pista > Iluminacao > Florais > Cronograma > Investimento.
const COMPONENT_ORDER = [
  "COVER",
  "BIA_STORY",
  "COUPLE_STORY",
  "CONCEPT",
  "MOODBOARD",
  "PALETTE",
  "ENTRANCE",
  "CEREMONY",
  "CAKE_TABLE",
  "LOUNGE",
  "GUEST_TABLES",
  "BAR",
  "BUFFET",
  "DANCE_FLOOR",
  "LIGHTING",
  "FLORALS",
  "TIMELINE",
  "INVESTMENT",
] as const;

// 02-brand-bible.md, "Quem e a Bia" — static, never AI-generated (it's the
// brand's own voice, not something derived per-event).
const BIA_STORY_TEXT =
  "A Bia não vende flores. Ela vende acolhimento. Antes de qualquer decisão de estilo, ela ouve — e cria junto com cada casal, sempre interpretando sonhos em vez de impor um estilo pronto.";

// 02-brand-bible.md, regra de ouro 4 — o investimento nunca aparece sozinho,
// sempre precedido do que ele contempla.
const INVESTMENT_INCLUDES = [
  "Desenvolvimento criativo",
  "Projeto personalizado",
  "Direção artística",
  "Logística",
  "Montagem",
  "Desmontagem",
  "Coordenação no dia do evento",
];

// 02-brand-bible.md, regra de ouro 6 — toda proposta termina com uma chamada
// à ação, nunca apenas agradecimento e telefone.
const TIMELINE_STEPS = [
  { label: "Reunião criativa", description: "Alinhamento do conceito e dos detalhes do projeto com a Bia." },
  { label: "Aprovação da proposta", description: "Validação do conceito, ambientes e investimento apresentados." },
  { label: "Entrada (sinal)", description: "Confirmação do projeto com o pagamento da entrada." },
  { label: "Assinatura do contrato", description: "Formalização do compromisso entre as partes." },
];

export function buildProposalComponents(input: {
  client: Client;
  event: Event;
  venue: Venue;
  diagnostico: DiagnosticoCriativo;
  narrative: ProposalComponentsResult;
}): UpsertProposalComponentInput[] {
  const { client, event, venue, diagnostico, narrative } = input;
  const orderOf = (type: (typeof COMPONENT_ORDER)[number]) => COMPONENT_ORDER.indexOf(type) + 1;

  const coupleNames = client.partnerTwoName
    ? `${client.partnerOneName} & ${client.partnerTwoName}`
    : client.partnerOneName;

  const componentsByType: Record<(typeof COMPONENT_ORDER)[number], Record<string, unknown>> = {
    COVER: {
      conceptName: narrative.concept.title,
      coupleNames,
      eventDate: event.ceremonyDateTime,
      venueName: venue.name,
    },
    BIA_STORY: { title: "A Bia", text: BIA_STORY_TEXT },
    COUPLE_STORY: { title: narrative.coupleStory.title, text: narrative.coupleStory.description },
    CONCEPT: { name: narrative.concept.title, description: narrative.concept.description },
    MOODBOARD: {
      textures: [],
      fabrics: diagnostico.mobiliarioSugerido,
      flowers: diagnostico.materiaisRecomendados,
      furniture: diagnostico.mobiliarioSugerido,
      lighting: diagnostico.iluminacaoSugerida ? [diagnostico.iluminacaoSugerida] : [],
      architecture: venue.structuralConstraints ? [venue.structuralConstraints] : [],
      objects: [],
    },
    PALETTE: { colors: diagnostico.paletaSugerida },
    ENTRANCE: { title: narrative.entrance.title, description: narrative.entrance.description },
    CEREMONY: { title: narrative.ceremony.title, description: narrative.ceremony.description },
    CAKE_TABLE: { title: narrative.cakeTable.title, description: narrative.cakeTable.description },
    LOUNGE: { title: narrative.lounge.title, description: narrative.lounge.description },
    GUEST_TABLES: { title: narrative.guestTables.title, description: narrative.guestTables.description },
    BAR: { title: narrative.bar.title, description: narrative.bar.description },
    BUFFET: { title: narrative.buffet.title, description: narrative.buffet.description },
    DANCE_FLOOR: { title: narrative.danceFloor.title, description: narrative.danceFloor.description },
    LIGHTING: { title: narrative.lighting.title, description: narrative.lighting.description },
    FLORALS: { title: narrative.florals.title, description: narrative.florals.description },
    TIMELINE: { steps: TIMELINE_STEPS },
    INVESTMENT: {
      includes: INVESTMENT_INCLUDES,
      amount: event.budgetAmount ?? client.budgetAmount ?? null,
      currency: client.budgetCurrency,
    },
  };

  return COMPONENT_ORDER.map((type) => ({
    type,
    order: orderOf(type),
    content: componentsByType[type],
  }));
}
