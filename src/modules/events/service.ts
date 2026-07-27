import type { EventStatus } from "@prisma/client";

import { withTenant } from "@/lib/tenant";
import { NotFoundError } from "@/lib/api";
import type { CreateEventInput, UpdateEventInput } from "./schema";

function emptyToUndefined(value?: string) {
  return value === "" ? undefined : value;
}

export async function listEvents(organizationId: string, status?: EventStatus) {
  return withTenant(organizationId, (tx) =>
    tx.event.findMany({
      where: { organizationId, ...(status ? { status } : {}) },
      orderBy: { updatedAt: "desc" },
      include: { client: { select: { id: true, name: true } }, memScore: true },
    }),
  );
}

export async function getEvent(organizationId: string, eventId: string) {
  return withTenant(organizationId, async (tx) => {
    const event = await tx.event.findFirst({
      where: { id: eventId, organizationId },
      include: {
        client: true,
        memScore: true,
        checklistItems: { orderBy: { order: "asc" } },
        budgetLines: { orderBy: { order: "asc" } },
        timelineItems: { orderBy: { order: "asc" } },
        documents: { orderBy: { createdAt: "desc" } },
        interviewSession: {
          include: { answers: { orderBy: { order: "asc" } } },
        },
      },
    });
    if (!event) throw new NotFoundError("Evento não encontrado");
    return event;
  });
}

export async function createEvent(organizationId: string, userId: string, input: CreateEventInput) {
  return withTenant(organizationId, async (tx) => {
    const event = await tx.event.create({
      data: {
        organizationId,
        name: input.name,
        clientId: emptyToUndefined(input.clientId),
        type: emptyToUndefined(input.type),
        eventDate: input.eventDate,
      },
    });

    await tx.activity.create({
      data: {
        organizationId,
        eventId: event.id,
        userId,
        action: "event.created",
        metadata: { name: event.name },
      },
    });

    return event;
  });
}

export async function updateEvent(
  organizationId: string,
  eventId: string,
  input: UpdateEventInput,
) {
  return withTenant(organizationId, async (tx) => {
    const existing = await tx.event.findFirst({ where: { id: eventId, organizationId } });
    if (!existing) throw new NotFoundError("Evento não encontrado");

    return tx.event.update({
      where: { id: eventId },
      data: {
        name: input.name,
        clientId: emptyToUndefined(input.clientId),
        type: emptyToUndefined(input.type),
        eventDate: input.eventDate,
        status: input.status,
      },
    });
  });
}

export async function archiveEvent(organizationId: string, eventId: string) {
  return updateEvent(organizationId, eventId, { status: "ARCHIVED" });
}
