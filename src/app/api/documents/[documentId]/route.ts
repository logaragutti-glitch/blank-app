import { NextRequest, NextResponse } from "next/server";

import { requireActiveSession } from "@/lib/session";
import { handleApiError } from "@/lib/api";
import { editDocument } from "@/modules/documents/service";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ documentId: string }> }) {
  try {
    const { organization } = await requireActiveSession();
    const { documentId } = await params;
    const body = await req.json();
    const document = await editDocument(organization.id, documentId, body.content);
    return NextResponse.json({ document });
  } catch (error) {
    return handleApiError(error);
  }
}
