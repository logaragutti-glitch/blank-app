import type { User, UserRole } from "@eve-os/types";

export interface CreateUserInput {
  tenantId: string;
  organizationId: string;
  email: string;
  passwordHash: string;
  name: string;
  role?: UserRole;
}

/** A User plus its password hash — never part of the shared @eve-os/types domain type. */
export interface UserWithPasswordHash {
  user: User;
  passwordHash: string;
}

export abstract class UserRepository {
  abstract create(input: CreateUserInput): Promise<User>;
  abstract findById(id: string): Promise<User | null>;
  /** All active-or-not members of an organization (e.g. for an assignee picker) — ordered by name. */
  abstract findByOrganization(organizationId: string): Promise<User[]>;
  abstract findWithPasswordHashByEmail(email: string): Promise<UserWithPasswordHash | null>;
  abstract setPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
  /** Only matches an unexpired token — an expired or unknown hash returns null, same as "not found". */
  abstract findByPasswordResetTokenHash(tokenHash: string): Promise<UserWithPasswordHash | null>;
  /** Updates the password and clears the reset token in one write — a token is single-use. */
  abstract completePasswordReset(userId: string, passwordHash: string): Promise<void>;
}
