import type { Role } from "@prisma/client";

import { withTenant } from "@/lib/tenant";
import { ConflictError, ForbiddenError } from "@/lib/api";
import type { InviteMemberInput } from "./schema";

function assertCanManageMembers(role: Role) {
  if (role !== "OWNER" && role !== "ADMIN") {
    throw new ForbiddenError("Apenas Owner ou Admin podem gerenciar membros");
  }
}

export async function listMembers(organizationId: string) {
  return withTenant(organizationId, (tx) =>
    tx.membership.findMany({
      where: { organizationId },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
  );
}

export async function listPendingInvitations(organizationId: string) {
  return withTenant(organizationId, (tx) =>
    tx.invitation.findMany({
      where: { organizationId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
  );
}

/**
 * Se o e-mail já pertence a um User, a Membership é criada de imediato — sem
 * infraestrutura de envio de e-mail no MVP, é a forma mais honesta de "convidar"
 * alguém que já tem conta. Caso contrário fica um Invitation PENDING, resolvido
 * automaticamente quando esse e-mail se cadastra (src/modules/auth/service.ts).
 */
export async function inviteMember(
  organizationId: string,
  inviterUserId: string,
  inviterRole: Role,
  input: InviteMemberInput,
) {
  assertCanManageMembers(inviterRole);

  return withTenant(organizationId, async (tx) => {
    const existingUser = await tx.user.findUnique({ where: { email: input.email } });

    if (existingUser) {
      const existingMembership = await tx.membership.findUnique({
        where: { userId_organizationId: { userId: existingUser.id, organizationId } },
      });
      if (existingMembership) {
        throw new ConflictError("Este e-mail já é membro da organização");
      }

      await tx.membership.create({
        data: { userId: existingUser.id, organizationId, role: input.role },
      });
    } else {
      const existingInvitation = await tx.invitation.findUnique({
        where: { organizationId_email: { organizationId, email: input.email } },
      });
      if (existingInvitation?.status === "PENDING") {
        throw new ConflictError("Já existe um convite pendente para este e-mail");
      }

      await tx.invitation.upsert({
        where: { organizationId_email: { organizationId, email: input.email } },
        update: { status: "PENDING", role: input.role },
        create: {
          organizationId,
          email: input.email,
          role: input.role,
          invitedByUserId: inviterUserId,
        },
      });
    }

    await tx.activity.create({
      data: {
        organizationId,
        userId: inviterUserId,
        action: "member.invited",
        metadata: { email: input.email, role: input.role },
      },
    });
  });
}

export async function updateMemberRole(
  organizationId: string,
  actingRole: Role,
  targetUserId: string,
  role: Role,
) {
  assertCanManageMembers(actingRole);

  return withTenant(organizationId, (tx) =>
    tx.membership.update({
      where: { userId_organizationId: { userId: targetUserId, organizationId } },
      data: { role },
    }),
  );
}
