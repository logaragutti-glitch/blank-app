import { NextRequest, NextResponse } from "next/server";

import { requireActiveSession } from "@/lib/session";
import { handleApiError } from "@/lib/api";
import { editDocument } from "@/modules/documents/service";

export async function PATCH(req: NextRequest, { params }: { params: { documentId: string } }) {
  try {
    const { organization } = await requireActiveSession();
    const body = await req.json();
    const document = await editDocument(organization.id, params.documentId, body.content);
    return NextResponse.json({ document });
  } catch (error) {
    return handleApiError(error);
  }
}
