import { z } from "zod";

import { db } from "@/lib/db";
import { OpenAiProvider } from "@/modules/ai/openai-provider";
import type { InterviewAnswers } from "./questions";

const clarifySchema = z.object({
  question: z.string().min(5).max(200).nullable(),
});

/**
 * Ponto de extensão de IA da entrevista (docs/ROADMAP.md Sprint 3): depois que a
 * árvore de regras (questions.ts) se esgota, a IA tem uma chance de propor UMA
 * pergunta extra de esclarecimento com base no que já foi respondido — nunca
 * decide o rumo da entrevista inteira, só complementa. Se não houver
 * OPENAI_API_KEY configurada ou a chamada falhar, a entrevista segue sem essa
 * pergunta (IA como copiloto, nunca bloqueio — ver docs/ARCHITECTURE.md §1).
 */
export async function getAiClarifyingQuestion(
  organizationId: string,
  answers: InterviewAnswers,
): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  const provider = new OpenAiProvider();
  const summary = Object.entries(answers)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  try {
    const { data, usage } = await provider.generateStructured({
      system:
        "Você é o Arquiteto MEM, copiloto de planejamento de eventos. Analise as respostas " +
        "de uma entrevista e decida se falta UMA informação importante para montar um projeto " +
        "profissional. Se sim, retorne a pergunta em português, curta e direta. Se as respostas " +
        "já são suficientes, retorne null. Responda em JSON: {\"question\": string | null}.",
      prompt: `Respostas coletadas até agora:\n${summary}`,
      parse: (raw) => clarifySchema.parse(raw).question,
      maxTokens: 200,
    });

    await db.aiGenerationLog.create({
      data: {
        organizationId,
        provider: provider.name,
        model: "gpt-4o-mini",
        module: "interview.clarify",
        promptSummary: summary.slice(0, 500),
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
      },
    });

    return data;
  } catch (error) {
    console.error("[interview.ai] clarifying question failed, seguindo sem ela:", error);
    return null;
  }
}
