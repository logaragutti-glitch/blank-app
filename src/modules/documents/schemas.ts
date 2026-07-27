import { z } from "zod";

/**
 * Forma do `content: Json` de cada tipo de documento (docs/DATABASE.md "Document").
 * Usado tanto para validar a resposta da IA (`AiProvider.generateStructured`) quanto
 * para validar uma edição manual antes de salvar como nova versão.
 */

export const dnaEventoSchema = z.object({
  essence: z.string().min(10),
  guidingEmotions: z.array(z.string()).min(2).max(6),
  keywords: z.array(z.string()).min(2).max(8),
  narrative: z.string().min(20),
});

export const mapaEmocaoSchema = z.object({
  moments: z
    .array(z.object({ phase: z.string(), emotion: z.string(), description: z.string() }))
    .min(2),
});

export const jornadaMemoravelSchema = z.object({
  stages: z.array(z.object({ title: z.string(), description: z.string() })).min(2),
});

export const linhaDoTempoSchema = z.object({
  items: z
    .array(z.object({ time: z.string(), title: z.string(), description: z.string().optional() }))
    .min(2),
});

export const planoOperacionalSchema = z.object({
  phases: z.array(z.object({ title: z.string(), tasks: z.array(z.string()).min(1) })).min(2),
});

export const checklistSchema = z.object({
  items: z.array(z.object({ title: z.string(), dueOffsetDays: z.number().int().optional() })).min(3),
});

export const planoFinanceiroSchema = z.object({
  lines: z
    .array(z.object({ category: z.string(), description: z.string(), amount: z.number().positive() }))
    .min(2),
});

export const planoBSchema = z.object({
  risks: z.array(z.object({ risk: z.string(), mitigation: z.string() })).min(2),
});

export const resumoExecutivoSchema = z.object({
  summary: z.string().min(30),
  highlights: z.array(z.string()).min(2).max(6),
});

export const DOCUMENT_SCHEMAS = {
  DNA_EVENTO: dnaEventoSchema,
  MAPA_EMOCAO: mapaEmocaoSchema,
  JORNADA_MEMORAVEL: jornadaMemoravelSchema,
  LINHA_DO_TEMPO: linhaDoTempoSchema,
  PLANO_OPERACIONAL: planoOperacionalSchema,
  CHECKLIST: checklistSchema,
  PLANO_FINANCEIRO: planoFinanceiroSchema,
  PLANO_B: planoBSchema,
  RESUMO_EXECUTIVO: resumoExecutivoSchema,
} as const;

export type GeneratableDocumentType = keyof typeof DOCUMENT_SCHEMAS;

export type DocumentContent<T extends GeneratableDocumentType> = z.infer<
  (typeof DOCUMENT_SCHEMAS)[T]
>;

/**
 * Esqueleto válido de cada tipo — usado para pré-preencher o editor manual
 * (`EditDocumentDialog`) quando não há conteúdo gerado ainda (documento com
 * `FAILED`, ex.: sem `OPENAI_API_KEY`). Editar a partir de um exemplo válido é
 * bem mais rápido do que escrever a estrutura JSON do zero.
 */
export const DOCUMENT_SKELETONS: { [K in GeneratableDocumentType]: DocumentContent<K> } = {
  DNA_EVENTO: {
    essence: "",
    guidingEmotions: ["", ""],
    keywords: ["", ""],
    narrative: "",
  },
  MAPA_EMOCAO: {
    moments: [
      { phase: "", emotion: "", description: "" },
      { phase: "", emotion: "", description: "" },
    ],
  },
  JORNADA_MEMORAVEL: {
    stages: [
      { title: "", description: "" },
      { title: "", description: "" },
    ],
  },
  LINHA_DO_TEMPO: {
    items: [
      { time: "", title: "" },
      { time: "", title: "" },
    ],
  },
  PLANO_OPERACIONAL: {
    phases: [
      { title: "", tasks: [""] },
      { title: "", tasks: [""] },
    ],
  },
  CHECKLIST: {
    items: [{ title: "" }, { title: "" }, { title: "" }],
  },
  PLANO_FINANCEIRO: {
    lines: [
      { category: "", description: "", amount: 0 },
      { category: "", description: "", amount: 0 },
    ],
  },
  PLANO_B: {
    risks: [
      { risk: "", mitigation: "" },
      { risk: "", mitigation: "" },
    ],
  },
  RESUMO_EXECUTIVO: {
    summary: "",
    highlights: ["", ""],
  },
};
