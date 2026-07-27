import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

/**
 * Todo acesso a dados de negócio passa por aqui. Além do filtro explícito por
 * `organizationId` que cada service já aplica nas queries, `withTenant` seta
 * `app.org_id` na transação — as Row Level Security policies em
 * `prisma/rls.sql` usam esse valor como segunda camada de isolamento. Ver
 * docs/ARCHITECTURE.md §4.
 */
export async function withTenant<T>(
  organizationId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.org_id', ${organizationId}, true)`;
    return fn(tx);
  });
}
