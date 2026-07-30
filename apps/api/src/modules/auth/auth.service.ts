import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import type { User } from "@eve-os/types";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import type { LoginDto } from "./dto/login.dto";
import type { RegisterDto } from "./dto/register.dto";
import type { JwtPayload } from "./jwt-payload";
import { UserRepository } from "./repositories/user.repository";

const PASSWORD_HASH_ROUNDS = 10;

export interface AuthResult {
  accessToken: string;
  user: User;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async register(input: RegisterDto): Promise<AuthResult> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: input.organizationId },
    });
    if (!organization) throw new NotFoundException("Organization not found");

    const passwordHash = await bcrypt.hash(input.password, PASSWORD_HASH_ROUNDS);

    let user: User;
    try {
      user = await this.users.create({
        tenantId: organization.tenantId,
        organizationId: organization.id,
        email: input.email,
        passwordHash,
        name: input.name,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("A user with this email already exists");
      }
      throw error;
    }

    return { accessToken: this.issueToken(user), user };
  }

  async login(input: LoginDto): Promise<AuthResult> {
    const record = await this.users.findWithPasswordHashByEmail(input.email);
    // Deliberately the same error for "no such user" and "wrong password" —
    // never let a client distinguish whether an email is registered.
    if (!record || !record.user.isActive) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const passwordMatches = await bcrypt.compare(input.password, record.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException("Invalid email or password");
    }

    return { accessToken: this.issueToken(record.user), user: record.user };
  }

  private issueToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      organizationId: user.organizationId,
      role: user.role,
      email: user.email,
    };
    return this.jwt.sign(payload);
  }
}
