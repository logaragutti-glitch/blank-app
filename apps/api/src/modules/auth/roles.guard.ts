import { ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { UserRole } from "@eve-os/types";
import { ROLES_KEY } from "./roles.decorator";
import type { JwtPayload } from "./jwt-payload";

/** Registered globally (see auth.module.ts) — runs after JwtAuthGuard, so req.user is already set. */
@Injectable()
export class RolesGuard {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const user = request.user;
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException("You do not have permission to perform this action");
    }
    return true;
  }
}
