import { NextRequest, NextResponse } from "next/server";

import { requireActiveSession } from "@/lib/session";
import { handleApiError } from "@/lib/api";
import { createClientSchema } from "@/modules/clients/schema";
import { createClient, listClients } from "@/modules/clients/service";

export async function GET() {
  try {
    const { organization } = await requireActiveSession();
    const clients = await listClients(organization.id);
    return NextResponse.json({ clients });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { organization } = await requireActiveSession();
    const body = createClientSchema.parse(await req.json());
    const client = await createClient(organization.id, body);
    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
