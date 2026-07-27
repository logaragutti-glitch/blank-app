import { describe, expect, it } from "vitest";

import { calculateMemScore } from "./score";
import { DOCUMENT_REGISTRY } from "./registry";
import type { GenerationContext } from "./registry";
import type { GenerationResult } from "./orchestrator-types";

const baseContext: GenerationContext = { eventName: "Evento Teste", answers: {} };

function allFailed(): GenerationResult[] {
  return DOCUMENT_REGISTRY.map((spec) => ({ type: spec.type, status: "FAILED" as const }));
}

function allReady(overrides: Partial<Record<string, unknown>> = {}): GenerationResult[] {
  return DOCUMENT_REGISTRY.map((spec) => ({
    type: spec.type,
    status: "READY" as const,
    content: overrides[spec.type] ?? {},
  }));
}

describe("calculateMemScore", () => {
  it("score baixo quando todos os documentos falham (cenário sem OPENAI_API_KEY)", () => {
    const result = calculateMemScore(baseContext, allFailed());
    expect(result.breakdown.completude).toBe(0);
    expect(result.score).toBeLessThan(50);
  });

  it("completude é a proporção de documentos prontos", () => {
    const results = allFailed();
    const firstType = results[0]?.type;
    if (!firstType) throw new Error("DOCUMENT_REGISTRY está vazio");
    results[0] = { type: firstType, status: "READY", content: {} };
    const result = calculateMemScore(baseContext, results);
    const expected = Math.round((1 / results.length) * 100);
    expect(result.breakdown.completude).toBe(expected);
  });

  it("orçamento neutro quando não há target_budget informado", () => {
    const results = allReady({
      PLANO_FINANCEIRO: { lines: [{ category: "Buffet", description: "x", amount: 1000 }] },
    });
    const result = calculateMemScore({ ...baseContext, answers: {} }, results);
    expect(result.breakdown.orcamento).toBe(60);
  });

  it("orçamento alto quando o total do Plano Financeiro bate com o alvo", () => {
    const results = allReady({
      PLANO_FINANCEIRO: {
        lines: [
          { category: "Buffet", description: "x", amount: 6000 },
          { category: "Som", description: "y", amount: 4000 },
        ],
      },
    });
    const context: GenerationContext = { ...baseContext, answers: { target_budget: 10000 } };
    expect(calculateMemScore(context, results).breakdown.orcamento).toBe(100);
  });

  it("orçamento baixo quando o total do Plano Financeiro está muito longe do alvo", () => {
    const results = allReady({
      PLANO_FINANCEIRO: { lines: [{ category: "Buffet", description: "x", amount: 50000 }] },
    });
    const context: GenerationContext = { ...baseContext, answers: { target_budget: 10000 } };
    expect(calculateMemScore(context, results).breakdown.orcamento).toBe(30);
  });

  it("riscos neutro (baixo) quando o Plano B não está pronto", () => {
    const result = calculateMemScore(baseContext, allFailed());
    expect(result.breakdown.riscos).toBe(20);
  });

  it("riscos sobe com mais riscos identificados, até o teto de 100", () => {
    const results = allReady({
      PLANO_B: {
        risks: [
          { risk: "Chuva", mitigation: "Tenda" },
          { risk: "Atraso de fornecedor", mitigation: "Plano de contingência" },
          { risk: "Falta de energia", mitigation: "Gerador" },
          { risk: "Cancelamento de convidado chave", mitigation: "Lista de espera" },
          { risk: "Problema de som", mitigation: "Equipamento reserva" },
        ],
      },
    });
    expect(calculateMemScore(baseContext, results).breakdown.riscos).toBe(100);
  });

  it("score final nunca passa de 100", () => {
    const results = allReady({
      PLANO_FINANCEIRO: { lines: [{ category: "x", description: "y", amount: 1000 }] },
      PLANO_B: { risks: Array.from({ length: 10 }, () => ({ risk: "r", mitigation: "m" })) },
    });
    const context: GenerationContext = { ...baseContext, answers: { target_budget: 1000 } };
    expect(calculateMemScore(context, results).score).toBeLessThanOrEqual(100);
  });
});
