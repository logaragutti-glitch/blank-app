import { NextRequest, NextResponse } from "next/server";
import type { EventStatus } from "@prisma/client";

import { requireActiveSession } from "@/lib/session";
import { handleApiError } from "@/lib/api";
import { createEventSchema } from "@/modules/events/schema";
import { createEvent, listEvents } from "@/modules/events/service";

export async function GET(req: NextRequest) {
  try {
    const { organization } = await requireActiveSession();
    const status = req.nextUrl.searchParams.get("status") as EventStatus | null;
    const events = await listEvents(organization.id, status ?? undefined);
    return NextResponse.json({ events });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { organization, userId } = await requireActiveSession();
    const body = createEventSchema.parse(await req.json());
    const event = await createEvent(organization.id, userId, body);
    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
