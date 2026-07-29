import type { AuditedEntity } from "./tenant";

export type UserRole = "owner" | "admin" | "member" | "viewer";

export interface User extends AuditedEntity {
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
}
