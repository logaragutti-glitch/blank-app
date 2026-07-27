import { NextRequest, NextResponse } from "next/server";

import { requireActiveSession } from "@/lib/session";
import { handleApiError } from "@/lib/api";
import { updateClientSchema } from "@/modules/clients/schema";
import { updateClient } from "@/modules/clients/service";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  try {
    const { organization } = await requireActiveSession();
    const { clientId } = await params;
    const body = updateClientSchema.parse(await req.json());
    const client = await updateClient(organization.id, clientId, body);
    return NextResponse.json({ client });
  } catch (error) {
    return handleApiError(error);
  }
}
