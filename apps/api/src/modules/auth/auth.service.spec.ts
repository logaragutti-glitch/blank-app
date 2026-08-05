import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import type { JwtService } from "@nestjs/jwt";
import bcrypt from "bcrypt";
import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { User } from "@eve-os/types";
import type { EmailPort } from "../../infrastructure/email/email.port";
import { AuthService } from "./auth.service";
import type { InviteRepository } from "./repositories/invite.repository";
import type { UserRepository } from "./repositories/user.repository";

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    tenantId: "tenant-1",
    organizationId: "org-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    deletedAt: null,
    createdBy: null,
    updatedBy: null,
    version: 1,
    email: "bia@evefestas.com",
    name: "Bia Azevedo",
    role: "MEMBER",
    isActive: true,
    ...overrides,
  };
}

describe("AuthService", () => {
  let users: jest.Mocked<UserRepository>;
  let invites: jest.Mocked<InviteRepository>;
  let jwt: jest.Mocked<JwtService>;
  let prisma: { organization: { findUnique: jest.Mock; findUniqueOrThrow: jest.Mock } };
  let email: jest.Mocked<EmailPort>;
  let service: AuthService;

  beforeEach(() => {
    users = {
      create: jest.fn(),
      findById: jest.fn(),
      findByOrganization: jest.fn(),
      findWithPasswordHashByEmail: jest.fn(),
      setPasswordResetToken: jest.fn(),
      findByPasswordResetTokenHash: jest.fn(),
      completePasswordReset: jest.fn(),
    };
    invites = {
      create: jest.fn(),
      findByTokenHash: jest.fn(),
      markAccepted: jest.fn(),
    };
    jwt = { sign: jest.fn().mockReturnValue("signed.jwt.token") } as unknown as jest.Mocked<JwtService>;
    prisma = { organization: { findUnique: jest.fn(), findUniqueOrThrow: jest.fn() } };
    email = { sendPasswordResetEmail: jest.fn(), sendInviteEmail: jest.fn() };
    service = new AuthService(users, invites, jwt, prisma as never, email);
  });

  describe("register", () => {
    it("throws NotFoundException when the organization does not exist", async () => {
      prisma.organization.findUnique.mockResolvedValue(null);

      await expect(
        service.register({ organizationId: "missing-org", email: "a@b.com", password: "supersecret1", name: "A" }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(users.create).not.toHaveBeenCalled();
    });

    it("hashes the password, creates the user scoped to the organization's tenant, and issues a token", async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: "org-1", tenantId: "tenant-1" });
      const user = buildUser();
      users.create.mockResolvedValue(user);

      const result = await service.register({
        organizationId: "org-1",
        email: user.email,
        password: "supersecret1",
        name: user.name,
      });

      expect(users.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: "tenant-1", organizationId: "org-1", email: user.email }),
      );
      const createdInput = users.create.mock.calls[0]?.[0];
      expect(createdInput?.passwordHash).not.toBe("supersecret1");
      expect(await bcrypt.compare("supersecret1", createdInput?.passwordHash ?? "")).toBe(true);

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: user.id, tenantId: user.tenantId, organizationId: user.organizationId }),
      );
      expect(result).toEqual({ accessToken: "signed.jwt.token", user });
    });

    it("throws ConflictException when the email is already registered", async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: "org-1", tenantId: "tenant-1" });
      users.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
          code: "P2002",
          clientVersion: "test",
        }),
      );

      await expect(
        service.register({ organizationId: "org-1", email: "dup@evefestas.com", password: "supersecret1", name: "A" }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("login", () => {
    it("throws UnauthorizedException when no user exists for the email", async () => {
      users.findWithPasswordHashByEmail.mockResolvedValue(null);
      await expect(service.login({ email: "nobody@evefestas.com", password: "supersecret1" })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it("throws UnauthorizedException when the user is inactive", async () => {
      const passwordHash = await bcrypt.hash("supersecret1", 4);
      users.findWithPasswordHashByEmail.mockResolvedValue({
        user: buildUser({ isActive: false }),
        passwordHash,
      });
      await expect(service.login({ email: "bia@evefestas.com", password: "supersecret1" })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it("throws UnauthorizedException when the password does not match", async () => {
      const passwordHash = await bcrypt.hash("correct-password", 4);
      users.findWithPasswordHashByEmail.mockResolvedValue({ user: buildUser(), passwordHash });
      await expect(service.login({ email: "bia@evefestas.com", password: "wrong-password" })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it("returns a token and the user on a correct password", async () => {
      const passwordHash = await bcrypt.hash("supersecret1", 4);
      const user = buildUser();
      users.findWithPasswordHashByEmail.mockResolvedValue({ user, passwordHash });

      const result = await service.login({ email: user.email, password: "supersecret1" });

      expect(result).toEqual({ accessToken: "signed.jwt.token", user });
    });
  });

  describe("forgotPassword", () => {
    it("returns the same generic message and sends no email when the address isn't registered", async () => {
      users.findWithPasswordHashByEmail.mockResolvedValue(null);

      const result = await service.forgotPassword({ email: "nobody@evefestas.com" });

      expect(result.message).toMatch(/if that email is registered/i);
      expect(users.setPasswordResetToken).not.toHaveBeenCalled();
      expect(email.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it("returns the same generic message and sends no email for an inactive user", async () => {
      const passwordHash = await bcrypt.hash("supersecret1", 4);
      users.findWithPasswordHashByEmail.mockResolvedValue({ user: buildUser({ isActive: false }), passwordHash });

      const result = await service.forgotPassword({ email: "bia@evefestas.com" });

      expect(result.message).toMatch(/if that email is registered/i);
      expect(email.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it("stores a hash of a fresh token (never the raw token) and emails a reset link containing the raw token", async () => {
      const passwordHash = await bcrypt.hash("supersecret1", 4);
      const user = buildUser();
      users.findWithPasswordHashByEmail.mockResolvedValue({ user, passwordHash });

      const result = await service.forgotPassword({ email: user.email });

      expect(result.message).toMatch(/if that email is registered/i);
      expect(users.setPasswordResetToken).toHaveBeenCalledTimes(1);
      const [userId, storedHash, expiresAt] = users.setPasswordResetToken.mock.calls[0]!;
      expect(userId).toBe(user.id);
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());

      expect(email.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
      const emailCall = email.sendPasswordResetEmail.mock.calls[0]![0];
      expect(emailCall.to).toBe(user.email);
      const rawToken = new URL(emailCall.resetUrl).searchParams.get("token");
      expect(rawToken).not.toBeNull();
      expect(createHash("sha256").update(rawToken!).digest("hex")).toBe(storedHash);
    });
  });

  describe("resetPassword", () => {
    it("throws BadRequestException when the token is invalid or expired", async () => {
      users.findByPasswordResetTokenHash.mockResolvedValue(null);

      await expect(service.resetPassword({ token: "bogus", newPassword: "newsecret1" })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(users.completePasswordReset).not.toHaveBeenCalled();
    });

    it("hashes the new password and clears the reset token via the repository on a valid token", async () => {
      const user = buildUser();
      users.findByPasswordResetTokenHash.mockResolvedValue({ user, passwordHash: "old-hash" });

      const result = await service.resetPassword({ token: "a-valid-raw-token", newPassword: "newsecret1" });

      expect(result).toEqual({ message: "Password updated" });
      expect(users.completePasswordReset).toHaveBeenCalledTimes(1);
      const [userId, newPasswordHash] = users.completePasswordReset.mock.calls[0]!;
      expect(userId).toBe(user.id);
      expect(await bcrypt.compare("newsecret1", newPasswordHash)).toBe(true);
    });

    it("looks the token up by its hash, never the raw value", async () => {
      users.findByPasswordResetTokenHash.mockResolvedValue(null);

      await expect(service.resetPassword({ token: "raw-token-value", newPassword: "newsecret1" })).rejects.toThrow();

      const lookedUpHash = users.findByPasswordResetTokenHash.mock.calls[0]![0];
      expect(lookedUpHash).not.toBe("raw-token-value");
      expect(lookedUpHash).toBe(createHash("sha256").update("raw-token-value").digest("hex"));
    });
  });

  describe("inviteMember", () => {
    it("throws ConflictException when a user already exists for the invited email", async () => {
      const inviter = buildUser({ id: "inviter-1" });
      users.findById.mockResolvedValue(inviter);
      users.findWithPasswordHashByEmail.mockResolvedValue({ user: buildUser(), passwordHash: "hash" });

      await expect(
        service.inviteMember(inviter.id, { email: "already-here@evefestas.com" }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(invites.create).not.toHaveBeenCalled();
      expect(email.sendInviteEmail).not.toHaveBeenCalled();
    });

    it("creates an invite scoped to the inviter's org/tenant and emails a link with the raw token", async () => {
      const inviter = buildUser({ id: "inviter-1", tenantId: "tenant-1", organizationId: "org-1", name: "Bia" });
      users.findById.mockResolvedValue(inviter);
      users.findWithPasswordHashByEmail.mockResolvedValue(null);
      prisma.organization.findUniqueOrThrow.mockResolvedValue({ id: "org-1", name: "Tia Bia Festas" });

      const result = await service.inviteMember(inviter.id, { email: "new-member@evefestas.com" });

      expect(result).toEqual({ message: "Invite sent" });
      expect(invites.create).toHaveBeenCalledTimes(1);
      const createInput = invites.create.mock.calls[0]![0];
      expect(createInput).toMatchObject({
        tenantId: "tenant-1",
        organizationId: "org-1",
        email: "new-member@evefestas.com",
        invitedBy: "inviter-1",
      });
      expect(createInput.expiresAt.getTime()).toBeGreaterThan(Date.now());

      expect(email.sendInviteEmail).toHaveBeenCalledTimes(1);
      const emailCall = email.sendInviteEmail.mock.calls[0]![0];
      expect(emailCall.to).toBe("new-member@evefestas.com");
      expect(emailCall.organizationName).toBe("Tia Bia Festas");
      expect(emailCall.invitedByName).toBe("Bia");
      const rawToken = new URL(emailCall.inviteUrl).searchParams.get("token");
      expect(rawToken).not.toBeNull();
      expect(createHash("sha256").update(rawToken!).digest("hex")).toBe(createInput.tokenHash);
    });
  });

  describe("acceptInvite", () => {
    it("throws BadRequestException when the invite token is invalid or expired", async () => {
      invites.findByTokenHash.mockResolvedValue(null);

      await expect(service.acceptInvite({ token: "bogus", name: "New Person", password: "newsecret1" })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(users.create).not.toHaveBeenCalled();
    });

    it("creates a user scoped to the invite's org/tenant, marks the invite accepted, and returns a token", async () => {
      const invite = {
        id: "invite-1",
        tenantId: "tenant-1",
        organizationId: "org-1",
        email: "invited@evefestas.com",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        invitedBy: "inviter-1",
        acceptedAt: null,
        createdAt: new Date(),
      };
      invites.findByTokenHash.mockResolvedValue(invite);
      const createdUser = buildUser({ id: "new-user-1", email: invite.email, name: "New Person" });
      users.create.mockResolvedValue(createdUser);

      const result = await service.acceptInvite({ token: "a-valid-raw-token", name: "New Person", password: "newsecret1" });

      expect(users.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: "tenant-1", organizationId: "org-1", email: invite.email, name: "New Person" }),
      );
      const createInput = users.create.mock.calls[0]![0];
      expect(await bcrypt.compare("newsecret1", createInput.passwordHash)).toBe(true);
      expect(invites.markAccepted).toHaveBeenCalledWith("invite-1");
      expect(result).toEqual({ accessToken: "signed.jwt.token", user: createdUser });
    });

    it("throws ConflictException when the invited email was registered independently in the meantime", async () => {
      const invite = {
        id: "invite-1",
        tenantId: "tenant-1",
        organizationId: "org-1",
        email: "invited@evefestas.com",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        invitedBy: "inviter-1",
        acceptedAt: null,
        createdAt: new Date(),
      };
      invites.findByTokenHash.mockResolvedValue(invite);
      users.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError("Unique constraint failed", { code: "P2002", clientVersion: "test" }),
      );

      await expect(
        service.acceptInvite({ token: "a-valid-raw-token", name: "New Person", password: "newsecret1" }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(invites.markAccepted).not.toHaveBeenCalled();
    });
  });
});
