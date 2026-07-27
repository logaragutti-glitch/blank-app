import { NextResponse } from "next/server";

import { requireActiveSession } from "@/lib/session";
import { handleApiError } from "@/lib/api";
import { getOrCreateSession } from "@/modules/interview/service";

export async function GET(_req: Request, { params }: { params: { eventId: string } }) {
  try {
    const { organization } = await requireActiveSession();
    const state = await getOrCreateSession(organization.id, params.eventId);
    return NextResponse.json(state);
  } catch (error) {
    return handleApiError(error);
  }
}
