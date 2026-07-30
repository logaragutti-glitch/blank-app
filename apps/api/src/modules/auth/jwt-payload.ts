import type { UserRole } from "@eve-os/types";

/** JWT claims — also what ends up as `req.user` once JwtStrategy validates the token. */
export interface JwtPayload {
  sub: string;
  tenantId: string;
  organizationId: string;
  role: UserRole;
  email: string;
}

export type AuthenticatedUser = JwtPayload;
