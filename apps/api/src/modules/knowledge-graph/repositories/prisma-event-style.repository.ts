import { Injectable } from "@nestjs/common";
import type { EventStyle } from "@eve-os/types";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service";
import { toEventStyleDomain } from "../mappers/event-style.mapper";
import { EventStyleRepository } from "./event-style.repository";

@Injectable()
export class PrismaEventStyleRepository implements EventStyleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string): Promise<EventStyle[]> {
    const styles = await this.prisma.eventStyle.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { name: "asc" },
    });
    return styles.map(toEventStyleDomain);
  }

  async findById(organizationId: string, id: string): Promise<EventStyle | null> {
    const style = await this.prisma.eventStyle.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    return style ? toEventStyleDomain(style) : null;
  }

  // `embedding` is Unsupported("vector(1536)") in schema.prisma, so it must
  // be read/written via raw SQL, always parameterized (never string
  // concatenation) — same pattern as PrismaInspirationImageRepository.
  async setEmbedding(id: string, embedding: number[]): Promise<void> {
    const vectorLiteral = `[${embedding.join(",")}]`;
    await this.prisma.$executeRaw`
      UPDATE event_styles
      SET embedding = ${vectorLiteral}::vector
      WHERE id = ${id}::uuid
    `;
  }

  async findSimilarByEmbedding(
    organizationId: string,
    embedding: number[],
    limit: number,
  ): Promise<EventStyle[]> {
    const vectorLiteral = `[${embedding.join(",")}]`;
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM event_styles
      WHERE organization_id = ${organizationId}::uuid
        AND deleted_at IS NULL
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${vectorLiteral}::vector
      LIMIT ${limit}
    `;
    if (rows.length === 0) return [];

    const styles = await this.prisma.eventStyle.findMany({ where: { id: { in: rows.map((r) => r.id) } } });
    const styleById = new Map(styles.map((style) => [style.id, style]));
    // Preserve the similarity ranking from the raw query — findMany's own
    // ordering does not reflect it.
    return rows
      .map((row) => styleById.get(row.id))
      .filter((style): style is (typeof styles)[number] => Boolean(style))
      .map(toEventStyleDomain);
  }
}
