import type { Role } from "@prisma/client";

/**
 * Sessão estendida com a organização ativa do usuário. Um usuário pode ter
 * múltiplas Memberships (ver docs/DATABASE.md); no MVP a "organização ativa"
 * é a primeira Membership encontrada. Troca explícita de organização fica
 * para pós-MVP (ver docs/BACKLOG.md, item de multi-organização por usuário).
 */
export interface ActiveOrganization {
  id: string;
  name: string;
  slug: string;
  role: Role;
}
