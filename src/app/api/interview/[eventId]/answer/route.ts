import { NextRequest, NextResponse } from "next/server";

import { requireActiveSession } from "@/lib/session";
import { handleApiError } from "@/lib/api";
import { submitAnswerSchema } from "@/modules/interview/schema";
import { submitAnswer } from "@/modules/interview/service";

export async function POST(req: NextRequest, { params }: { params: { eventId: string } }) {
  try {
    const { organization } = await requireActiveSession();
    const body = submitAnswerSchema.parse(await req.json());
    const state = await submitAnswer(organization.id, params.eventId, body.questionKey, body.rawValue);
    return NextResponse.json(state);
  } catch (error) {
    return handleApiError(error);
  }
}
