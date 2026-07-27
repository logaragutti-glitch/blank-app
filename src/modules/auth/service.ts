import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { ConflictError } from "@/lib/api";
import { slugify } from "@/lib/utils";
import type { SignUpInput } from "./schema";

async function uniqueSlug(name: string) {
  const base = slugify(name) || "organizacao";
  let slug = base;
  let attempt = 0;

  while (await db.organization.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${base}-${attempt + 1}`;
  }

  return slug;
}

/**
 * Cria a conta e resolve o onboarding (Fluxo 1, docs/USER_FLOWS.md): se o
 * e-mail já tinha convites pendentes (ver Invitation), o usuário entra nas
 * organizações que o convidaram em vez de criar uma nova — reflete o caso de
 * um freelancer/membro convidado antes de ter conta (docs/DATABASE.md, User).
 */
export async function signUp(input: SignUpInput) {
  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ConflictError("Já existe uma conta com este e-mail");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  return db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name: input.name, email: input.email, passwordHash },
    });

    const pendingInvitations = await tx.invitation.findMany({
      where: { email: input.email, status: "PENDING" },
    });

    if (pendingInvitations.length > 0) {
      await tx.membership.createMany({
        data: pendingInvitations.map((invitation) => ({
          userId: user.id,
          organizationId: invitation.organizationId,
          role: invitation.role,
        })),
      });
      await tx.invitation.updateMany({
        where: { id: { in: pendingInvitations.map((i) => i.id) } },
        data: { status: "ACCEPTED" },
      });
      return user;
    }

    const slug = await uniqueSlug(input.organizationName);
    const organization = await tx.organization.create({
      data: { name: input.organizationName, slug },
    });
    await tx.membership.create({
      data: { userId: user.id, organizationId: organization.id, role: "OWNER" },
    });

    return user;
  });
}
