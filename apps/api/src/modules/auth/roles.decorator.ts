import { SetMetadata } from "@nestjs/common";
import type { UserRole } from "@eve-os/types";

export const ROLES_KEY = "roles";

/** Restricts a route to the given roles — with no @Roles() at all, any authenticated user is allowed. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
