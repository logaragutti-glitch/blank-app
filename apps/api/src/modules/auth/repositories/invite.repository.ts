export interface CreateInviteInput {
  tenantId: string;
  organizationId: string;
  email: string;
  tokenHash: string;
  expiresAt: Date;
  invitedBy: string;
}

export interface Invite {
  id: string;
  tenantId: string;
  organizationId: string;
  email: string;
  expiresAt: Date;
  invitedBy: string;
  acceptedAt: Date | null;
  createdAt: Date;
}

export abstract class InviteRepository {
  abstract create(input: CreateInviteInput): Promise<Invite>;
  /** Only matches an unexpired, not-yet-accepted invite — anything else returns null. */
  abstract findByTokenHash(tokenHash: string): Promise<Invite | null>;
  abstract markAccepted(id: string): Promise<void>;
}
