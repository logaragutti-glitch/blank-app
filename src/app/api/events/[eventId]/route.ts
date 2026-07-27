import { NextRequest, NextResponse } from "next/server";

import { requireActiveSession } from "@/lib/session";
import { handleApiError } from "@/lib/api";
import { updateEventSchema } from "@/modules/events/schema";
import { archiveEvent, getEvent, updateEvent } from "@/modules/events/service";

export async function GET(_req: NextRequest, { params }: { params: { eventId: string } }) {
  try {
    const { organization } = await requireActiveSession();
    const event = await getEvent(organization.id, params.eventId);
    return NextResponse.json({ event });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { eventId: string } }) {
  try {
    const { organization } = await requireActiveSession();
    const body = updateEventSchema.parse(await req.json());
    const event = await updateEvent(organization.id, params.eventId, body);
    return NextResponse.json({ event });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { eventId: string } }) {
  try {
    const { organization } = await requireActiveSession();
    const event = await archiveEvent(organization.id, params.eventId);
    return NextResponse.json({ event });
  } catch (error) {
    return handleApiError(error);
  }
}
