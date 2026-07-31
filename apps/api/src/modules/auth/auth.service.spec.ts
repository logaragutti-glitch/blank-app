import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import type { JwtService } from "@nestjs/jwt";
import bcrypt from "bcrypt";
import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { User } from "@eve-os/types";
import type { EmailPort } from "../../infrastructure/email/email.port";
import { AuthService } from "./auth.service";
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
  let jwt: jest.Mocked<JwtService>;
  let prisma: { organization: { findUnique: jest.Mock } };
  let email: jest.Mocked<EmailPort>;
  let service: AuthService;

  beforeEach(() => {
    users = {
      create: jest.fn(),
      findById: jest.fn(),
      findWithPasswordHashByEmail: jest.fn(),
      setPasswordResetToken: jest.fn(),
      findByPasswordResetTokenHash: jest.fn(),
      completePasswordReset: jest.fn(),
    };
    jwt = { sign: jest.fn().mockReturnValue("signed.jwt.token") } as unknown as jest.Mocked<JwtService>;
    prisma = { organization: { findUnique: jest.fn() } };
    email = { sendPasswordResetEmail: jest.fn() };
    service = new AuthService(users, jwt, prisma as never, email);
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
});
