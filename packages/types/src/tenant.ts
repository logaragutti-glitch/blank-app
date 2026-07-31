/** Multi-tenant base fields shared by every persisted domain entity. */
export interface TenantScoped {
  tenantId: string;
  organizationId: string;
}

export interface AuditedEntity extends TenantScoped {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  version: number;
}
