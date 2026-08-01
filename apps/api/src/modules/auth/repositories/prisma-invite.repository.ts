import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service";
import { InviteRepository, type CreateInviteInput, type Invite } from "./invite.repository";

@Injectable()
export class PrismaInviteRepository implements InviteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateInviteInput): Promise<Invite> {
    const invite = await this.prisma.invite.create({
      data: {
        tenantId: input.tenantId,
        organizationId: input.organizationId,
        email: input.email,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        invitedBy: input.invitedBy,
      },
    });
    return invite;
  }

  async findByTokenHash(tokenHash: string): Promise<Invite | null> {
    return this.prisma.invite.findFirst({
      where: { tokenHash, expiresAt: { gt: new Date() }, acceptedAt: null },
    });
  }

  async markAccepted(id: string): Promise<void> {
    await this.prisma.invite.update({ where: { id }, data: { acceptedAt: new Date() } });
  }
}
