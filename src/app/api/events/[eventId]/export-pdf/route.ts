import { NextRequest, NextResponse } from "next/server";

import { requireActiveSession } from "@/lib/session";
import { handleApiError } from "@/lib/api";
import { exportEventPdf } from "@/modules/documents/export";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { organization, userId } = await requireActiveSession();
    const { eventId } = await params;
    const { url } = await exportEventPdf(organization.id, eventId, userId);
    return NextResponse.json({ url });
  } catch (error) {
    return handleApiError(error);
  }
}
