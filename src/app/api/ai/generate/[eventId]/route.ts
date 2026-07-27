import { NextResponse } from "next/server";

import { requireActiveSession } from "@/lib/session";
import { handleApiError } from "@/lib/api";
import { generateDocuments } from "@/modules/documents/orchestrator";

export async function POST(_req: Request, { params }: { params: { eventId: string } }) {
  try {
    const { organization } = await requireActiveSession();
    const results = await generateDocuments(organization.id, params.eventId);
    return NextResponse.json({ results });
  } catch (error) {
    return handleApiError(error);
  }
}
