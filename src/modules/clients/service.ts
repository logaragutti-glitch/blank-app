import { withTenant } from "@/lib/tenant";
import { NotFoundError } from "@/lib/api";
import type { CreateClientInput, UpdateClientInput } from "./schema";

function emptyToUndefined(value?: string) {
  return value === "" ? undefined : value;
}

export async function listClients(organizationId: string) {
  return withTenant(organizationId, (tx) =>
    tx.client.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
      include: { _count: { select: { events: true } } },
    }),
  );
}

export async function createClient(organizationId: string, input: CreateClientInput) {
  return withTenant(organizationId, (tx) =>
    tx.client.create({
      data: {
        organizationId,
        name: input.name,
        email: emptyToUndefined(input.email),
        phone: emptyToUndefined(input.phone),
        notes: emptyToUndefined(input.notes),
      },
    }),
  );
}

export async function updateClient(
  organizationId: string,
  clientId: string,
  input: UpdateClientInput,
) {
  return withTenant(organizationId, async (tx) => {
    const existing = await tx.client.findFirst({ where: { id: clientId, organizationId } });
    if (!existing) throw new NotFoundError("Cliente não encontrado");

    return tx.client.update({
      where: { id: clientId },
      data: {
        name: input.name,
        email: emptyToUndefined(input.email),
        phone: emptyToUndefined(input.phone),
        notes: emptyToUndefined(input.notes),
      },
    });
  });
}
