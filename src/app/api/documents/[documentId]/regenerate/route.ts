import { NextResponse } from "next/server";

import { requireActiveSession } from "@/lib/session";
import { handleApiError } from "@/lib/api";
import { regenerateDocument } from "@/modules/documents/service";

export async function POST(_req: Request, { params }: { params: { documentId: string } }) {
  try {
    const { organization } = await requireActiveSession();
    const document = await regenerateDocument(organization.id, params.documentId);
    return NextResponse.json({ document });
  } catch (error) {
    return handleApiError(error);
  }
}
