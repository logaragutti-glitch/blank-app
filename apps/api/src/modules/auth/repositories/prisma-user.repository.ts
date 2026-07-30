import { Injectable } from "@nestjs/common";
import type { User } from "@eve-os/types";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service";
import { toUserDomain } from "../mappers/user.mapper";
import {
  UserRepository,
  type CreateUserInput,
  type UserWithPasswordHash,
} from "./user.repository";

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateUserInput): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        tenantId: input.tenantId,
        organizationId: input.organizationId,
        email: input.email,
        passwordHash: input.passwordHash,
        name: input.name,
        role: input.role ?? undefined,
      },
    });
    return toUserDomain(user);
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    return user ? toUserDomain(user) : null;
  }

  async findWithPasswordHashByEmail(email: string): Promise<UserWithPasswordHash | null> {
    const user = await this.prisma.user.findFirst({ where: { email, deletedAt: null } });
    if (!user) return null;
    return { user: toUserDomain(user), passwordHash: user.passwordHash };
  }
}
