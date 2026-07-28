import { renderToBuffer } from "@react-pdf/renderer";

import { withTenant } from "@/lib/tenant";
import { NotFoundError } from "@/lib/api";
import { uploadPdfAndGetSignedUrl } from "@/lib/storage";
import { DOCUMENT_REGISTRY } from "./registry";
import { pickLatestPerType } from "./utils";
import { EventPdfDocument, type PdfDocumentEntry } from "./pdf";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Monta o PDF executivo a partir da versão mais recente de cada documento PRONTO
 * (`READY`) do evento e sobe para o Supabase Storage. Documentos `PENDING`/`FAILED`
 * são omitidos — não faz sentido exportar um placeholder vazio; se nenhum documento
 * estiver pronto ainda, o PDF sai só com a capa (nome do evento + MEM Score, se houver).
 *
 * `userId` é opcional só para permitir chamar isto fora de uma requisição autenticada
 * (ex.: um job futuro); toda rota/action real deve sempre passar o `userId` da sessão.
 */
export async function exportEventPdf(organizationId: string, eventId: string, userId?: string) {
  const event = await withTenant(organizationId, async (tx) => {
    const found = await tx.event.findFirst({
      where: { id: eventId, organizationId },
      include: { client: true, memScore: true, documents: { orderBy: { createdAt: "desc" } } },
    });
    if (!found) throw new NotFoundError("Evento não encontrado");
    return found;
  });

  const documents: PdfDocumentEntry[] = pickLatestPerType(event.documents)
    .filter((d) => d.status === "READY" && d.content)
    .map((d) => {
      const spec = DOCUMENT_REGISTRY.find((s) => s.type === d.type);
      return { type: d.type, label: spec?.label ?? d.type, content: d.content } as PdfDocumentEntry;
    })
    // Mesma ordem em que os documentos aparecem no produto (docs/ARCHITECTURE.md "Documentos"),
    // não a ordem de criação no banco.
    .sort(
      (a, b) =>
        DOCUMENT_REGISTRY.findIndex((s) => s.type === a.type) -
        DOCUMENT_REGISTRY.findIndex((s) => s.type === b.type),
    );

  const buffer = await renderToBuffer(
    EventPdfDocument({
      event: {
        name: event.name,
        clientName: event.client?.name ?? null,
        eventDate: event.eventDate ? new Date(event.eventDate).toLocaleDateString("pt-BR") : null,
        location: event.location,
        guestCount: event.guestCount,
        targetBudget: event.targetBudget ? formatCurrency(Number(event.targetBudget)) : null,
      },
      memScore: event.memScore ? { score: event.memScore.score, breakdown: event.memScore.breakdown as Record<string, number> } : null,
      documents,
    }),
  );

  const path = `${organizationId}/${eventId}/${Date.now()}.pdf`;
  const url = await uploadPdfAndGetSignedUrl(path, buffer);

  await withTenant(organizationId, (tx) =>
    tx.activity.create({
      data: {
        organizationId,
        eventId,
        userId,
        action: "event.pdf_exported",
        metadata: { documentCount: documents.length },
      },
    }),
  );

  return { url };
}
