"use server";

import { revalidatePath } from "next/cache";

import { requireActiveSession } from "@/lib/session";
import { generateDocuments } from "./orchestrator";
import { editDocument, regenerateDocument } from "./service";
import { exportEventPdf } from "./export";

export async function generateDocumentsAction(eventId: string) {
  const { organization } = await requireActiveSession();
  await generateDocuments(organization.id, eventId);
  revalidatePath(`/events/${eventId}`);
}

export async function regenerateDocumentAction(eventId: string, documentId: string) {
  const { organization } = await requireActiveSession();
  await regenerateDocument(organization.id, documentId);
  revalidatePath(`/events/${eventId}`);
}

export interface EditDocumentFormState {
  error?: string;
  success?: boolean;
}

export async function editDocumentAction(
  eventId: string,
  documentId: string,
  _prevState: EditDocumentFormState,
  formData: FormData,
): Promise<EditDocumentFormState> {
  const { organization } = await requireActiveSession();

  const raw = formData.get("content");
  let parsed: unknown;
  try {
    parsed = JSON.parse(String(raw));
  } catch {
    return { error: "JSON inválido" };
  }

  try {
    await editDocument(organization.id, documentId, parsed);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível salvar" };
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

export interface ExportPdfFormState {
  url?: string;
  error?: string;
}

export async function exportPdfAction(
  eventId: string,
  _prevState: ExportPdfFormState,
): Promise<ExportPdfFormState> {
  const { organization, userId } = await requireActiveSession();

  try {
    const { url } = await exportEventPdf(organization.id, eventId, userId);
    return { url };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível gerar o PDF" };
  }
}
