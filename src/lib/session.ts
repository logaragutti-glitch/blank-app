import { auth } from "@/lib/auth";
import type { ActiveOrganization } from "@/modules/auth/types";

export class UnauthorizedError extends Error {
  constructor(message = "Sessão inválida ou sem organização ativa") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export interface ActiveSession {
  userId: string;
  userName: string | null;
  userEmail: string;
  organization: ActiveOrganization;
}

/** Usado por Server Components, Server Actions e rotas de API. */
export async function requireActiveSession(): Promise<ActiveSession> {
  const session = await auth();
  if (!session?.user?.id || !session.organization) {
    throw new UnauthorizedError();
  }
  return {
    userId: session.user.id,
    userName: session.user.name ?? null,
    userEmail: session.user.email ?? "",
    organization: session.organization,
  };
}
