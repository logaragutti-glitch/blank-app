import type { User as UserPrismaModel } from "@prisma/client";
import type { User, UserRole } from "@eve-os/types";

export function toUserDomain(model: UserPrismaModel): User {
  return {
    id: model.id,
    tenantId: model.tenantId,
    organizationId: model.organizationId,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
    deletedAt: model.deletedAt ? model.deletedAt.toISOString() : null,
    createdBy: model.createdBy,
    updatedBy: model.updatedBy,
    version: model.version,
    email: model.email,
    name: model.name,
    role: model.role as UserRole,
    isActive: model.isActive,
  };
}
