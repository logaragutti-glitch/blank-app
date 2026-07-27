import { withTenant } from "@/lib/tenant";
import { NotFoundError } from "@/lib/api";
import { toAnswersMap } from "@/modules/interview/questions";
import { OpenAiProvider } from "@/modules/ai/openai-provider";
import { DOCUMENT_REGISTRY, type DocumentSpec, type GenerationContext } from "./registry";
import type { DocumentContent } from "./schemas";
import type { GenerationResult } from "./orchestrator-types";
import { calculateMemScore } from "./score";

/**
 * Recalcula o MEM Score a partir do estado atual dos documentos (última versão de
 * cada tipo) — chamado após qualquer geração, regeneração ou edição manual, nunca
 * só na geração em lote. Ver docs/DATABASE.md "MemScore" ("recalculado com
 * frequência, toda edição relevante").
 */
export async function recalculateMemScore(tx: Tx, eventId: string) {
  const event = await tx.event.findFirst({
    where: { id: eventId },
    include: { interviewSession: { include: { answers: true } }, documents: true },
  });
  if (!event) return;

  const context: GenerationContext = {
    eventName: event.name,
    answers: toAnswersMap(event.interviewSession?.answers ?? []),
  };

  const latestByType = new Map<string, (typeof event.documents)[number]>();
  for (const doc of event.documents) {
    const current = latestByType.get(doc.type);
    if (!current || doc.version > current.version) latestByType.set(doc.type, doc);
  }

  const results: GenerationResult[] = DOCUMENT_REGISTRY.map((spec) => {
    const doc = latestByType.get(spec.type);
    if (doc?.status === "READY") {
      return { type: spec.type, status: "READY", content: doc.content };
    }
    return { type: spec.type, status: "FAILED" };
  });

  const memScore = calculateMemScore(context, results);
  await tx.memScore.upsert({
    where: { eventId },
    create: { eventId, score: memScore.score, breakdown: memScore.breakdown },
    update: { score: memScore.score, breakdown: memScore.breakdown },
  });
}

export type Tx = Parameters<Parameters<typeof withTenant>[1]>[0];

export async function generateOne(
  spec: DocumentSpec,
  context: GenerationContext,
): Promise<GenerationResult> {
  const provider = new OpenAiProvider();
  try {
    const { data, usage } = await provider.generateStructured({
      system: spec.systemPrompt,
      prompt: spec.buildPrompt(context),
      parse: (raw) => spec.schema.parse(raw),
    });
    return { type: spec.type, status: "READY", content: data, usage };
  } catch (error) {
    return {
      type: spec.type,
      status: "FAILED",
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

export async function syncChecklist(tx: Tx, eventId: string, result: GenerationResult) {
  if (result.status !== "READY") return;
  const content = result.content as DocumentContent<"CHECKLIST">;

  await tx.checklistItem.deleteMany({ where: { eventId } });
  await tx.checklistItem.createMany({
    data: content.items.map((item, order) => ({ eventId, title: item.title, order })),
  });
}

export async function syncBudget(tx: Tx, eventId: string, result: GenerationResult) {
  if (result.status !== "READY") return;
  const content = result.content as DocumentContent<"PLANO_FINANCEIRO">;

  await tx.budgetLine.deleteMany({ where: { eventId } });
  await tx.budgetLine.createMany({
    data: content.lines.map((line, order) => ({
      eventId,
      category: line.category,
      description: line.description,
      amount: line.amount,
      order,
    })),
  });
}

export async function syncTimeline(tx: Tx, eventId: string, result: GenerationResult) {
  if (result.status !== "READY") return;
  const content = result.content as DocumentContent<"LINHA_DO_TEMPO">;

  await tx.timelineItem.deleteMany({ where: { eventId } });
  await tx.timelineItem.createMany({
    data: content.items.map((item, order) => ({
      eventId,
      title: item.title,
      description: item.description,
      timeLabel: item.time,
      order,
    })),
  });
}

/**
 * Dispara a geração dos documentos MEM em paralelo. As chamadas de IA acontecem
 * FORA de transação de banco (podem levar segundos cada; segurar uma transação
 * Postgres aberta por todo esse tempo prenderia conexões à toa). O resultado é
 * persistido de uma vez ao final. Ver docs/ARCHITECTURE.md sobre o gatilho para
 * migrar isso para uma fila de workers, caso o volume justifique.
 */
export async function generateDocuments(organizationId: string, eventId: string) {
  const { eventName, context } = await withTenant(organizationId, async (tx) => {
    const event = await tx.event.findFirst({
      where: { id: eventId, organizationId },
      include: { interviewSession: { include: { answers: true } } },
    });
    if (!event) throw new NotFoundError("Evento não encontrado");

    const answers = toAnswersMap(event.interviewSession?.answers ?? []);
    return { eventName: event.name, context: { eventName: event.name, answers } };
  });

  await withTenant(organizationId, async (tx) => {
    for (const spec of DOCUMENT_REGISTRY) {
      const latest = await tx.document.findFirst({
        where: { eventId, type: spec.type },
        orderBy: { version: "desc" },
      });
      if (latest) {
        await tx.document.update({ where: { id: latest.id }, data: { status: "GENERATING" } });
      } else {
        await tx.document.create({ data: { eventId, type: spec.type, status: "GENERATING", version: 1 } });
      }
    }
  });

  const results = await Promise.all(DOCUMENT_REGISTRY.map((spec) => generateOne(spec, context)));

  await withTenant(organizationId, async (tx) => {
    for (const result of results) {
      const latest = await tx.document.findFirst({
        where: { eventId, type: result.type },
        orderBy: { version: "desc" },
      });
      if (!latest) continue;

      await tx.document.update({
        where: { id: latest.id },
        data: { status: result.status, content: result.content ?? undefined },
      });

      if (result.status === "READY" && result.usage) {
        await tx.aiGenerationLog.create({
          data: {
            organizationId,
            provider: "openai",
            model: "gpt-4o-mini",
            module: `documents.${result.type.toLowerCase()}`,
            promptSummary: `Geração de ${result.type} para "${eventName}"`,
            inputTokens: result.usage.inputTokens,
            outputTokens: result.usage.outputTokens,
          },
        });
      }
    }

    const checklistResult = results.find((r) => r.type === "CHECKLIST");
    if (checklistResult) await syncChecklist(tx, eventId, checklistResult);

    const budgetResult = results.find((r) => r.type === "PLANO_FINANCEIRO");
    if (budgetResult) await syncBudget(tx, eventId, budgetResult);

    const timelineResult = results.find((r) => r.type === "LINHA_DO_TEMPO");
    if (timelineResult) await syncTimeline(tx, eventId, timelineResult);

    await recalculateMemScore(tx, eventId);

    await tx.event.update({ where: { id: eventId }, data: { status: "REVIEW" } });

    await tx.activity.create({
      data: {
        organizationId,
        eventId,
        action: "documents.generated",
        metadata: {
          eventName,
          readyCount: results.filter((r) => r.status === "READY").length,
          totalCount: results.length,
        },
      },
    });
  });

  return results;
}
