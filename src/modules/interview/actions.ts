"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireActiveSession } from "@/lib/session";
import { submitAnswerSchema } from "./schema";
import { completeInterview, submitAnswer } from "./service";

export interface InterviewFormState {
  error?: string;
}

export async function submitAnswerAction(
  eventId: string,
  _prevState: InterviewFormState,
  formData: FormData,
): Promise<InterviewFormState> {
  const { organization } = await requireActiveSession();

  const parsed = submitAnswerSchema.safeParse({
    questionKey: formData.get("questionKey"),
    rawValue: formData.get("rawValue") ?? "",
  });

  if (!parsed.success) {
    return { error: "Dados inválidos" };
  }

  try {
    await submitAnswer(organization.id, eventId, parsed.data.questionKey, parsed.data.rawValue);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível salvar" };
  }

  revalidatePath(`/events/${eventId}/interview`);
  return {};
}

export async function completeInterviewAction(eventId: string) {
  const { organization, userId } = await requireActiveSession();
  await completeInterview(organization.id, eventId, userId);
  revalidatePath(`/events/${eventId}`);
  redirect(`/events/${eventId}`);
}
