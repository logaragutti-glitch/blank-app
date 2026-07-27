import { describe, expect, it } from "vitest";

import type { QuestionDef } from "./questions";
import { InvalidAnswerError, parseAnswerValue } from "./schema";

const textQuestion: QuestionDef = { key: "objective", text: "?", type: "text" };
const optionalTextQuestion: QuestionDef = { key: "notes", text: "?", type: "text", optional: true };
const numberQuestion: QuestionDef = { key: "guest_count", text: "?", type: "number" };
const selectQuestion: QuestionDef = {
  key: "event_type",
  text: "?",
  type: "select",
  options: [
    { value: "casamento", label: "Casamento" },
    { value: "corporativo", label: "Corporativo" },
  ],
};

describe("parseAnswerValue", () => {
  it("aceita texto não vazio", () => {
    expect(parseAnswerValue(textQuestion, "Celebrar a união")).toBe("Celebrar a união");
  });

  it("rejeita texto vazio quando a pergunta é obrigatória", () => {
    expect(() => parseAnswerValue(textQuestion, "")).toThrow(InvalidAnswerError);
  });

  it("aceita texto vazio (pular) quando a pergunta é opcional", () => {
    expect(parseAnswerValue(optionalTextQuestion, "")).toBe("");
    expect(parseAnswerValue(optionalTextQuestion, "   ")).toBe("");
  });

  it("converte número válido", () => {
    expect(parseAnswerValue(numberQuestion, "80")).toBe(80);
  });

  it("rejeita número inválido", () => {
    expect(() => parseAnswerValue(numberQuestion, "oitenta")).toThrow(InvalidAnswerError);
  });

  it("aceita opção válida de select", () => {
    expect(parseAnswerValue(selectQuestion, "casamento")).toBe("casamento");
  });

  it("rejeita opção que não existe no select (payload manipulado)", () => {
    expect(() => parseAnswerValue(selectQuestion, "sequestro")).toThrow(InvalidAnswerError);
  });

  it("aparas espaços em branco antes de validar", () => {
    expect(parseAnswerValue(textQuestion, "  celebrar  ")).toBe("celebrar");
  });
});
