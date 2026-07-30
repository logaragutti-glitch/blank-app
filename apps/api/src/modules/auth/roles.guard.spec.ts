import { ForbiddenException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import { RolesGuard } from "./roles.guard";
import type { JwtPayload } from "./jwt-payload";

function buildContext(user?: JwtPayload): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe("RolesGuard", () => {
  it("allows the request through when no @Roles() metadata is set", () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(undefined) } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(buildContext())).toBe(true);
  });

  it("allows the request through when the user's role is in the required list", () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(["OWNER", "ADMIN"]) } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const context = buildContext({
      sub: "user-1",
      tenantId: "tenant-1",
      organizationId: "org-1",
      role: "ADMIN",
      email: "a@b.com",
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it("throws ForbiddenException when the user's role is not in the required list", () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(["OWNER"]) } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const context = buildContext({
      sub: "user-1",
      tenantId: "tenant-1",
      organizationId: "org-1",
      role: "MEMBER",
      email: "a@b.com",
    });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
