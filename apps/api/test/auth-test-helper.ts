import type { INestApplication } from "@nestjs/common";
import request from "supertest";

/**
 * Registers a fresh user against an already-seeded Organization and returns
 * a bearer token for it — every business endpoint now requires
 * authentication (see modules/auth), so e2e specs need this instead of the
 * old tenantId/organizationId query params.
 */
export async function registerTestUser(
  app: INestApplication,
  organizationId: string,
  overrides: { email?: string; name?: string; password?: string } = {},
): Promise<{ accessToken: string; userId: string }> {
  const email = overrides.email ?? `test-${Date.now()}-${Math.random().toString(36).slice(2)}@evefestas.com`;
  const response = await request(app.getHttpServer())
    .post("/auth/register")
    .send({
      organizationId,
      email,
      password: overrides.password ?? "supersecret123",
      name: overrides.name ?? "Test User",
    })
    .expect(201);

  return { accessToken: response.body.accessToken as string, userId: response.body.user.id as string };
}

export function authHeader(accessToken: string): [string, string] {
  return ["Authorization", `Bearer ${accessToken}`];
}
