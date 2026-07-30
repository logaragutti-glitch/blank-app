import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { AuthenticatedUser } from "./jwt-payload";

/** The authenticated request's JWT claims — tenantId/organizationId come from here now, never from a query param. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    return request.user;
  },
);
