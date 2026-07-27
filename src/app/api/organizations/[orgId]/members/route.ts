import { NextResponse } from "next/server";

import { requireActiveSession } from "@/lib/session";
import { handleApiError } from "@/lib/api";
import { listMembers } from "@/modules/organizations/service";

export async function GET(_req: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { organization } = await requireActiveSession();
    const { orgId } = await params;
    if (organization.id !== orgId) {
      return NextResponse.json({ error: { code: "FORBIDDEN", message: "Organização inválida" } }, { status: 403 });
    }
    const members = await listMembers(organization.id);
    return NextResponse.json({ members });
  } catch (error) {
    return handleApiError(error);
  }
}
