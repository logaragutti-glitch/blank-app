import type { ZodType } from "zod";

import {
  DOCUMENT_SCHEMAS,
  type GeneratableDocumentType,
} from "./schemas";

export interface GenerationContext {
  eventName: string;
  answers: Record<string, string | number>;
}

export interface DocumentSpec {
  type: GeneratableDocumentType;
  label: string;
  schema: ZodType;
  systemPrompt: string;
  buildPrompt: (context: GenerationContext) => string;
}

function formatBriefing(context: GenerationContext): string {
  const lines = Object.entries(context.answers)
    .filter(([, value]) => value !== "")
    .map(([key, value]) => `- ${key}: ${value}`);
  return `Evento: ${context.eventName}\n\nBriefing coletado na entrevista:\n${lines.join("\n")}`;
}

const ARCHITECT_SYSTEM =
  "Você é o Arquiteto MEM, copiloto de planejamento de eventos da MEM Technologies. " +
  "A partir do briefing de um evento, produza um documento profissional, específico ao " +
  "briefing (nunca genérico), em português do Brasil. Responda apenas com JSON válido, " +
  "sem markdown, seguindo exatamente o formato pedido.";

export const DOCUMENT_REGISTRY: DocumentSpec[] = [
  {
    type: "DNA_EVENTO",
    label: "DNA do Evento™",
    schema: DOCUMENT_SCHEMAS.DNA_EVENTO,
    systemPrompt: ARCHITECT_SYSTEM,
    buildPrompt: (ctx) =>
      `${formatBriefing(ctx)}\n\nDefina o DNA deste evento: {"essence": string (a essência em ` +
      `uma frase), "guidingEmotions": string[] (2 a 6 emoções-guia), "keywords": string[] ` +
      `(2 a 8 palavras-chave), "narrative": string (um parágrafo conectando tudo)}.`,
  },
  {
    type: "MAPA_EMOCAO",
    label: "Mapa da Emoção™",
    schema: DOCUMENT_SCHEMAS.MAPA_EMOCAO,
    systemPrompt: ARCHITECT_SYSTEM,
    buildPrompt: (ctx) =>
      `${formatBriefing(ctx)}\n\nMapeie a jornada emocional do evento: {"moments": ` +
      `{"phase": string (ex.: chegada, abertura, ápice, encerramento), "emotion": string, ` +
      `"description": string}[] (mínimo 2, ideal 4 a 6 momentos)}.`,
  },
  {
    type: "JORNADA_MEMORAVEL",
    label: "Jornada Memorável™",
    schema: DOCUMENT_SCHEMAS.JORNADA_MEMORAVEL,
    systemPrompt: ARCHITECT_SYSTEM,
    buildPrompt: (ctx) =>
      `${formatBriefing(ctx)}\n\nDesenhe a jornada do convidado do início ao fim: ` +
      `{"stages": {"title": string, "description": string}[] (mínimo 3 etapas)}.`,
  },
  {
    type: "LINHA_DO_TEMPO",
    label: "Linha do Tempo MEM™",
    schema: DOCUMENT_SCHEMAS.LINHA_DO_TEMPO,
    systemPrompt: ARCHITECT_SYSTEM,
    buildPrompt: (ctx) =>
      `${formatBriefing(ctx)}\n\nMonte o cronograma do dia do evento: {"items": {"time": ` +
      `string (horário, ex.: "18h00"), "title": string, "description": string opcional}[] ` +
      `(mínimo 4 itens, em ordem cronológica)}.`,
  },
  {
    type: "PLANO_OPERACIONAL",
    label: "Plano Operacional™",
    schema: DOCUMENT_SCHEMAS.PLANO_OPERACIONAL,
    systemPrompt: ARCHITECT_SYSTEM,
    buildPrompt: (ctx) =>
      `${formatBriefing(ctx)}\n\nDefina o plano operacional por fase de produção (pré-evento, ` +
      `montagem, execução, desmontagem): {"phases": {"title": string, "tasks": string[]}[] ` +
      `(mínimo 2 fases, cada uma com pelo menos 2 tarefas)}.`,
  },
  {
    type: "CHECKLIST",
    label: "Checklist",
    schema: DOCUMENT_SCHEMAS.CHECKLIST,
    systemPrompt: ARCHITECT_SYSTEM,
    buildPrompt: (ctx) =>
      `${formatBriefing(ctx)}\n\nGere um checklist de providências para este evento: ` +
      `{"items": {"title": string, "dueOffsetDays": number opcional (dias antes do evento)}[] ` +
      `(mínimo 5 itens, específicos ao briefing, não genéricos)}.`,
  },
  {
    type: "PLANO_FINANCEIRO",
    label: "Plano Financeiro",
    schema: DOCUMENT_SCHEMAS.PLANO_FINANCEIRO,
    systemPrompt: ARCHITECT_SYSTEM,
    buildPrompt: (ctx) =>
      `${formatBriefing(ctx)}\n\nMonte um orçamento inicial coerente com o orçamento alvo ` +
      `informado (se houver): {"lines": {"category": string, "description": string, ` +
      `"amount": number (em reais)}[] (mínimo 3 categorias)}.`,
  },
  {
    type: "PLANO_B",
    label: "Plano B",
    schema: DOCUMENT_SCHEMAS.PLANO_B,
    systemPrompt: ARCHITECT_SYSTEM,
    buildPrompt: (ctx) =>
      `${formatBriefing(ctx)}\n\nIdentifique riscos relevantes para este evento específico e ` +
      `o plano de contingência de cada um: {"risks": {"risk": string, "mitigation": string}[] ` +
      `(mínimo 2 riscos)}.`,
  },
  {
    type: "RESUMO_EXECUTIVO",
    label: "Resumo Executivo",
    schema: DOCUMENT_SCHEMAS.RESUMO_EXECUTIVO,
    systemPrompt: ARCHITECT_SYSTEM,
    buildPrompt: (ctx) =>
      `${formatBriefing(ctx)}\n\nEscreva um resumo executivo do projeto para apresentar ao ` +
      `cliente: {"summary": string (2 a 4 frases), "highlights": string[] (2 a 6 destaques)}.`,
  },
];
