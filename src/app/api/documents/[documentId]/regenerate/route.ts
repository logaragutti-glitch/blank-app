import { NextResponse } from "next/server";

import { requireActiveSession } from "@/lib/session";
import { handleApiError } from "@/lib/api";
import { regenerateDocument } from "@/modules/documents/service";

export async function POST(_req: Request, { params }: { params: Promise<{ documentId: string }> }) {
  try {
    const { organization } = await requireActiveSession();
    const { documentId } = await params;
    const document = await regenerateDocument(organization.id, documentId);
    return NextResponse.json({ document });
  } catch (error) {
    return handleApiError(error);
  }
}
