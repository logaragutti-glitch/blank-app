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
  abstract findWithPasswordHashByEmail(email: string): Promise<UserWithPasswordHash | null>;
}
