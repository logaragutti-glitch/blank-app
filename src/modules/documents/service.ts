import { withTenant } from "@/lib/tenant";
import { NotFoundError, UnsupportedDocumentTypeError } from "@/lib/api";
import { toAnswersMap } from "@/modules/interview/questions";
import { DOCUMENT_REGISTRY } from "./registry";
import { DOCUMENT_SCHEMAS, type GeneratableDocumentType } from "./schemas";
import { generateOne, recalculateMemScore, syncBudget, syncChecklist, syncTimeline } from "./orchestrator";
import type { GenerationResult } from "./orchestrator-types";

/** `getEvent` traz todas as versões (histórico); a UI só precisa da mais recente por tipo. */
export function pickLatestPerType<T extends { type: string; version: number }>(documents: T[]): T[] {
  const latestByType = new Map<string, T>();
  for (const doc of documents) {
    const current = latestByType.get(doc.type);
    if (!current || doc.version > current.version) {
      latestByType.set(doc.type, doc);
    }
  }
  return Array.from(latestByType.values());
}

async function syncRelational(
  tx: Parameters<Parameters<typeof withTenant>[1]>[0],
  eventId: string,
  type: GeneratableDocumentType,
  result: GenerationResult,
) {
  if (type === "CHECKLIST") await syncChecklist(tx, eventId, result);
  if (type === "PLANO_FINANCEIRO") await syncBudget(tx, eventId, result);
  if (type === "LINHA_DO_TEMPO") await syncTimeline(tx, eventId, result);
}

/** Regenera um único documento via IA, criando uma nova versão (a anterior fica no histórico). */
export async function regenerateDocument(organizationId: string, documentId: string) {
  const prepared = await withTenant(organizationId, async (tx) => {
    const document = await tx.document.findFirst({
      where: { id: documentId, event: { organizationId } },
      include: { event: { include: { interviewSession: { include: { answers: true } } } } },
    });
    if (!document) throw new NotFoundError("Documento não encontrado");

    const spec = DOCUMENT_REGISTRY.find((s) => s.type === document.type);
    if (!spec) throw new UnsupportedDocumentTypeError("Este documento não é gerado por IA");

    const answers = toAnswersMap(document.event.interviewSession?.answers ?? []);
    return {
      eventId: document.eventId,
      type: document.type as GeneratableDocumentType,
      version: document.version,
      spec,
      context: { eventName: document.event.name, answers },
    };
  });

  const result = await generateOne(prepared.spec, prepared.context);

  return withTenant(organizationId, async (tx) => {
    const latest = await tx.document.findFirst({
      where: { eventId: prepared.eventId, type: prepared.type },
      orderBy: { version: "desc" },
    });
    const nextVersion = (latest?.version ?? prepared.version) + 1;

    const newDocument = await tx.document.create({
      data: {
        eventId: prepared.eventId,
        type: prepared.type,
        version: nextVersion,
        status: result.status,
        content: result.content ?? undefined,
      },
    });

    if (result.status === "READY" && result.usage) {
      await tx.aiGenerationLog.create({
        data: {
          organizationId,
          provider: "openai",
          model: "gpt-4o-mini",
          module: `documents.${prepared.type.toLowerCase()}.regenerate`,
          promptSummary: `Regeneração de ${prepared.type}`,
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
        },
      });
    }

    await syncRelational(tx, prepared.eventId, prepared.type, result);
    await recalculateMemScore(tx, prepared.eventId);

    return newDocument;
  });
}

/** Edição manual: sobrescreve criando uma nova versão, validada contra o mesmo schema da IA. */
export async function editDocument(organizationId: string, documentId: string, rawContent: unknown) {
  return withTenant(organizationId, async (tx) => {
    const document = await tx.document.findFirst({
      where: { id: documentId, event: { organizationId } },
    });
    if (!document) throw new NotFoundError("Documento não encontrado");

    const schema = DOCUMENT_SCHEMAS[document.type as GeneratableDocumentType];
    if (!schema) throw new UnsupportedDocumentTypeError("Este tipo de documento não pode ser editado");

    const content = schema.parse(rawContent);

    const latest = await tx.document.findFirst({
      where: { eventId: document.eventId, type: document.type },
      orderBy: { version: "desc" },
    });
    const nextVersion = (latest?.version ?? document.version) + 1;

    const newDocument = await tx.document.create({
      data: {
        eventId: document.eventId,
        type: document.type,
        version: nextVersion,
        status: "READY",
        content,
      },
    });

    await syncRelational(tx, document.eventId, document.type as GeneratableDocumentType, {
      type: document.type as GeneratableDocumentType,
      status: "READY",
      content,
    });
    await recalculateMemScore(tx, document.eventId);

    return newDocument;
  });
}
