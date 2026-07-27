"use server";

import { revalidatePath } from "next/cache";

import { requireActiveSession } from "@/lib/session";
import { createEventSchema } from "./schema";
import { createEvent } from "./service";

export interface EventFormState {
  error?: string;
  success?: boolean;
}

export async function createEventAction(
  _prevState: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const { organization, userId } = await requireActiveSession();

  const parsed = createEventSchema.safeParse({
    name: formData.get("name"),
    clientId: formData.get("clientId"),
    type: formData.get("type"),
    eventDate: formData.get("eventDate") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  await createEvent(organization.id, userId, parsed.data);
  revalidatePath("/events");
  revalidatePath("/dashboard");
  return { success: true };
}
