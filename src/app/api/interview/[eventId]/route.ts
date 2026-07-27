import { NextResponse } from "next/server";

import { requireActiveSession } from "@/lib/session";
import { handleApiError } from "@/lib/api";
import { getOrCreateSession } from "@/modules/interview/service";

export async function GET(_req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { organization } = await requireActiveSession();
    const { eventId } = await params;
    const state = await getOrCreateSession(organization.id, eventId);
    return NextResponse.json(state);
  } catch (error) {
    return handleApiError(error);
  }
}
