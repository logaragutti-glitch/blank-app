import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireActiveSession } from "@/lib/session";
import { handleApiError } from "@/lib/api";
import { updateMemberRole } from "@/modules/organizations/service";

const patchSchema = z.object({ role: z.enum(["OWNER", "ADMIN", "MEMBER"]) });

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orgId: string; userId: string } },
) {
  try {
    const { organization } = await requireActiveSession();
    if (organization.id !== params.orgId) {
      return NextResponse.json({ error: { code: "FORBIDDEN", message: "Organização inválida" } }, { status: 403 });
    }
    const { role } = patchSchema.parse(await req.json());
    const membership = await updateMemberRole(organization.id, organization.role, params.userId, role);
    return NextResponse.json({ membership });
  } catch (error) {
    return handleApiError(error);
  }
}
