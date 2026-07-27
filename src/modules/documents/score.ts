import type { GenerationContext } from "./registry";
import type { DocumentContent } from "./schemas";
import type { GenerationResult } from "./orchestrator-types";

/**
 * MEM Score™ — nota 0-100 calculada por regras (não por IA, ver docs/DATABASE.md
 * "MemScore"), a partir de três dimensões simples e explicáveis. Cada dimensão vira
 * uma entrada do `breakdown` mostrada ao usuário, para o score nunca parecer uma
 * caixa-preta.
 */
export interface MemScoreResult {
  score: number;
  breakdown: Record<string, number>;
}

function completudeScore(results: GenerationResult[]): number {
  const ready = results.filter((r) => r.status === "READY").length;
  return Math.round((ready / results.length) * 100);
}

function orcamentoScore(context: GenerationContext, results: GenerationResult[]): number {
  const targetBudget = context.answers.target_budget;
  const financeiro = results.find((r) => r.type === "PLANO_FINANCEIRO");

  if (financeiro?.status !== "READY" || typeof targetBudget !== "number" || targetBudget <= 0) {
    return 60; // neutro: não há dado suficiente para julgar aderência
  }

  const content = financeiro.content as DocumentContent<"PLANO_FINANCEIRO"> | undefined;
  if (!content?.lines?.length) return 60;

  const total = content.lines.reduce((sum, line) => sum + line.amount, 0);
  const deviation = Math.abs(total - targetBudget) / targetBudget;

  if (deviation <= 0.1) return 100;
  if (deviation <= 0.25) return 80;
  if (deviation <= 0.5) return 55;
  return 30;
}

function riscosScore(results: GenerationResult[]): number {
  const planoB = results.find((r) => r.type === "PLANO_B");
  if (planoB?.status !== "READY") return 20;

  const content = planoB.content as DocumentContent<"PLANO_B"> | undefined;
  return Math.min(100, (content?.risks?.length ?? 0) * 25);
}

export function calculateMemScore(
  context: GenerationContext,
  results: GenerationResult[],
): MemScoreResult {
  const completude = completudeScore(results);
  const orcamento = orcamentoScore(context, results);
  const riscos = riscosScore(results);

  const score = Math.round((completude + orcamento + riscos) / 3);

  return { score, breakdown: { completude, orcamento, riscos } };
}
