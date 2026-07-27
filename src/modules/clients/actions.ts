"use server";

import { revalidatePath } from "next/cache";

import { requireActiveSession } from "@/lib/session";
import { createClientSchema } from "./schema";
import { createClient } from "./service";

export interface ClientFormState {
  error?: string;
  success?: boolean;
}

export async function createClientAction(
  _prevState: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const { organization } = await requireActiveSession();

  const parsed = createClientSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  await createClient(organization.id, parsed.data);
  revalidatePath("/clients");
  return { success: true };
}
