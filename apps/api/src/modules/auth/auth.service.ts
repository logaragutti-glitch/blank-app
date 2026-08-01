import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcrypt";
import { createHash, randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { User } from "@eve-os/types";
import { EmailPort } from "../../infrastructure/email/email.port";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import type { AcceptInviteDto } from "./dto/accept-invite.dto";
import type { ForgotPasswordDto } from "./dto/forgot-password.dto";
import type { InviteMemberDto } from "./dto/invite-member.dto";
import type { LoginDto } from "./dto/login.dto";
import type { RegisterDto } from "./dto/register.dto";
import type { ResetPasswordDto } from "./dto/reset-password.dto";
import type { JwtPayload } from "./jwt-payload";
import { InviteRepository } from "./repositories/invite.repository";
import { UserRepository } from "./repositories/user.repository";

const PASSWORD_HASH_ROUNDS = 10;
const PASSWORD_RESET_TOKEN_BYTES = 32;
const PASSWORD_RESET_EXPIRY_MINUTES = 60;
const INVITE_TOKEN_BYTES = 32;
const INVITE_EXPIRY_DAYS = 7;

export interface AuthResult {
  accessToken: string;
  user: User;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly invites: InviteRepository,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly email: EmailPort,
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

  async forgotPassword(input: ForgotPasswordDto): Promise<{ message: string }> {
    const message = "If that email is registered, a password reset link has been sent.";
    const record = await this.users.findWithPasswordHashByEmail(input.email);
    // Same "don't leak whether the email exists" principle as login — the
    // response is identical either way, only a real match sends an email.
    if (!record || !record.user.isActive) return { message };

    const rawToken = randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString("hex");
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MINUTES * 60 * 1000);
    await this.users.setPasswordResetToken(record.user.id, this.hashToken(rawToken), expiresAt);

    const webAppUrl = process.env.WEB_APP_URL ?? "http://localhost:3000";
    await this.email.sendPasswordResetEmail({
      to: record.user.email,
      resetUrl: `${webAppUrl}/reset-password?token=${rawToken}`,
      expiresInMinutes: PASSWORD_RESET_EXPIRY_MINUTES,
    });

    return { message };
  }

  async resetPassword(input: ResetPasswordDto): Promise<{ message: string }> {
    const record = await this.users.findByPasswordResetTokenHash(this.hashToken(input.token));
    if (!record) throw new BadRequestException("Invalid or expired reset token");

    const passwordHash = await bcrypt.hash(input.newPassword, PASSWORD_HASH_ROUNDS);
    await this.users.completePasswordReset(record.user.id, passwordHash);

    return { message: "Password updated" };
  }

  /**
   * No route is gated to OWNER/ADMIN here — self-registration always creates
   * MEMBER users and there is no promotion path anywhere in the system, so
   * any authenticated member can invite another one (same reasoning already
   * applied to the Knowledge Graph's write endpoints for apps/admin).
   */
  async inviteMember(inviterId: string, input: InviteMemberDto): Promise<{ message: string }> {
    const inviter = await this.users.findById(inviterId);
    if (!inviter) throw new UnauthorizedException();

    const existing = await this.users.findWithPasswordHashByEmail(input.email);
    if (existing) throw new ConflictException("A user with this email already exists");

    const organization = await this.prisma.organization.findUniqueOrThrow({
      where: { id: inviter.organizationId },
    });

    const rawToken = randomBytes(INVITE_TOKEN_BYTES).toString("hex");
    const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    await this.invites.create({
      tenantId: inviter.tenantId,
      organizationId: inviter.organizationId,
      email: input.email,
      tokenHash: this.hashToken(rawToken),
      expiresAt,
      invitedBy: inviter.id,
    });

    const webAppUrl = process.env.WEB_APP_URL ?? "http://localhost:3000";
    await this.email.sendInviteEmail({
      to: input.email,
      inviteUrl: `${webAppUrl}/accept-invite?token=${rawToken}`,
      organizationName: organization.name,
      invitedByName: inviter.name,
      expiresInDays: INVITE_EXPIRY_DAYS,
    });

    return { message: "Invite sent" };
  }

  async acceptInvite(input: AcceptInviteDto): Promise<AuthResult> {
    const invite = await this.invites.findByTokenHash(this.hashToken(input.token));
    if (!invite) throw new BadRequestException("Invalid or expired invite");

    const passwordHash = await bcrypt.hash(input.password, PASSWORD_HASH_ROUNDS);
    let user: User;
    try {
      user = await this.users.create({
        tenantId: invite.tenantId,
        organizationId: invite.organizationId,
        email: invite.email,
        passwordHash,
        name: input.name,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("A user with this email already exists");
      }
      throw error;
    }
    await this.invites.markAccepted(invite.id);

    return { accessToken: this.issueToken(user), user };
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
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
