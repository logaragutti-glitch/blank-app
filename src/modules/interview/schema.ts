import { z } from "zod";

import type { QuestionDef } from "./questions";

export const submitAnswerSchema = z.object({
  questionKey: z.string().min(1),
  rawValue: z.string(),
});

export class InvalidAnswerError extends Error {}

/** Converte o valor cru do formulário para o tipo esperado pela pergunta, validando. */
export function parseAnswerValue(question: QuestionDef, rawValue: string): string | number {
  const trimmed = rawValue.trim();

  if (!trimmed) {
    if (question.optional) return "";
    throw new InvalidAnswerError("Essa pergunta é obrigatória");
  }

  if (question.type === "number") {
    const num = Number(trimmed);
    if (Number.isNaN(num)) throw new InvalidAnswerError("Informe um número válido");
    return num;
  }

  if (question.type === "select") {
    const isValidOption = question.options?.some((option) => option.value === trimmed);
    if (!isValidOption) throw new InvalidAnswerError("Opção inválida");
    return trimmed;
  }

  return trimmed;
}
