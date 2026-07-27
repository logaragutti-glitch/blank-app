"use server";

import { revalidatePath } from "next/cache";

import { requireActiveSession } from "@/lib/session";
import { inviteMemberSchema } from "./schema";
import { inviteMember } from "./service";

export interface InviteFormState {
  error?: string;
  success?: boolean;
}

export async function inviteMemberAction(
  _prevState: InviteFormState,
  formData: FormData,
): Promise<InviteFormState> {
  const { organization, userId } = await requireActiveSession();

  const parsed = inviteMemberSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  try {
    await inviteMember(organization.id, userId, organization.role, parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível convidar" };
  }

  revalidatePath("/settings");
  return { success: true };
}
