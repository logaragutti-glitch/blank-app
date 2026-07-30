import type { AuditedEntity } from "./tenant";

export type UserRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

/**
 * A person who operates the system (the Bia and her team), never the
 * couple/client (see Client) — password hash is deliberately not part of
 * this domain type; it stays inside the auth module's repository layer.
 */
export interface User extends AuditedEntity {
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
}
