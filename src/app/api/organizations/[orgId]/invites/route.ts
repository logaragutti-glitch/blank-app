import { NextRequest, NextResponse } from "next/server";

import { requireActiveSession } from "@/lib/session";
import { handleApiError } from "@/lib/api";
import { inviteMemberSchema } from "@/modules/organizations/schema";
import { inviteMember } from "@/modules/organizations/service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { organization, userId } = await requireActiveSession();
    const { orgId } = await params;
    if (organization.id !== orgId) {
      return NextResponse.json({ error: { code: "FORBIDDEN", message: "Organização inválida" } }, { status: 403 });
    }
    const body = inviteMemberSchema.parse(await req.json());
    await inviteMember(organization.id, userId, organization.role, body);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
