import { describe, expect, it } from "vitest";

import {
  estimateProgress,
  findQuestionByKey,
  getNextRuleQuestion,
  ruleQuestionSequence,
  toAnswersMap,
} from "./questions";

describe("getNextRuleQuestion", () => {
  it("começa por event_type quando não há respostas", () => {
    expect(getNextRuleQuestion({})?.key).toBe("event_type");
  });

  it("pergunta objective logo depois de event_type", () => {
    expect(getNextRuleQuestion({ event_type: "casamento" })?.key).toBe("objective");
  });

  it("entra no ramo de casamento depois de objective respondida", () => {
    const next = getNextRuleQuestion({ event_type: "casamento", objective: "celebrar" });
    expect(next?.key).toBe("ceremony_style");
  });

  it("entra no ramo corporativo (perguntas diferentes do casamento)", () => {
    const next = getNextRuleQuestion({ event_type: "corporativo", objective: "networking" });
    expect(next?.key).toBe("business_goal");
  });

  it("sem ramo reconhecido, pula direto para as perguntas comuns", () => {
    const next = getNextRuleQuestion({ event_type: "aniversario", objective: "comemorar" });
    expect(next?.key).toBe("guest_count");
  });

  it("retorna null quando a árvore de regras está esgotada", () => {
    const allAnswered = {
      event_type: "aniversario",
      objective: "comemorar",
      guest_count: 50,
      event_date: "2026-01-01",
      location: "Casa",
      target_budget: 5000,
      target_audience: "Amigos",
      restrictions: "",
      vendors_hired: "",
    };
    expect(getNextRuleQuestion(allAnswered)).toBeNull();
  });

  it("perguntas opcionais respondidas com string vazia contam como respondidas (pular)", () => {
    const answers = {
      event_type: "casamento",
      objective: "celebrar",
      ceremony_style: "civil",
      traditions: "", // pulada
    };
    // a próxima deveria ser a primeira pergunta comum, não `traditions` de novo
    expect(getNextRuleQuestion(answers)?.key).toBe("guest_count");
  });
});

describe("ruleQuestionSequence — regressão do bug de invalidação (Sprint 3)", () => {
  it("a sequência para casamento inclui perguntas que não existem no ramo corporativo", () => {
    const weddingSequence = ruleQuestionSequence({ event_type: "casamento" }).map((q) => q.key);
    expect(weddingSequence).toContain("ceremony_style");
    expect(weddingSequence).not.toContain("business_goal");
  });

  it("a sequência para corporativo inclui perguntas que não existem no ramo casamento", () => {
    const corporateSequence = ruleQuestionSequence({ event_type: "corporativo" }).map((q) => q.key);
    expect(corporateSequence).toContain("business_goal");
    expect(corporateSequence).not.toContain("ceremony_style");
  });

  it("perguntas comuns (independentes de ramo) aparecem nos dois casos", () => {
    const wedding = ruleQuestionSequence({ event_type: "casamento" }).map((q) => q.key);
    const corporate = ruleQuestionSequence({ event_type: "corporativo" }).map((q) => q.key);
    for (const commonKey of ["guest_count", "location", "target_budget"]) {
      expect(wedding).toContain(commonKey);
      expect(corporate).toContain(commonKey);
    }
  });
});

describe("findQuestionByKey", () => {
  it("encontra uma pergunta comum independente do ramo", () => {
    expect(findQuestionByKey({}, "guest_count")?.text).toContain("convidados");
  });

  it("não encontra uma pergunta de um ramo que não corresponde ao event_type atual", () => {
    expect(findQuestionByKey({ event_type: "corporativo" }, "ceremony_style")).toBeUndefined();
  });
});

describe("estimateProgress", () => {
  it("0% sem nenhuma resposta", () => {
    expect(estimateProgress({})).toBe(0);
  });

  it("100% quando toda a sequência atual está respondida", () => {
    const answers = {
      event_type: "aniversario",
      objective: "comemorar",
      guest_count: 50,
      event_date: "2026-01-01",
      location: "Casa",
      target_budget: 5000,
      target_audience: "Amigos",
      restrictions: "",
      vendors_hired: "",
    };
    expect(estimateProgress(answers)).toBe(100);
  });

  it("nunca passa de 100 mesmo com chaves estranhas nas respostas", () => {
    expect(estimateProgress({ event_type: "casamento", lixo: "abc" })).toBeLessThanOrEqual(100);
  });
});

describe("toAnswersMap", () => {
  it("converte a lista de respostas em um mapa por questionKey", () => {
    const map = toAnswersMap([
      { questionKey: "event_type", answerValue: "casamento" },
      { questionKey: "guest_count", answerValue: 80 },
    ]);
    expect(map).toEqual({ event_type: "casamento", guest_count: 80 });
  });

  it("lista vazia vira mapa vazio", () => {
    expect(toAnswersMap([])).toEqual({});
  });
});
