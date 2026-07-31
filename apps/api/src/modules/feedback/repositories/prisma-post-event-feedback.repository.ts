import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { PostEventFeedback } from "@eve-os/types";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service";
import { toPostEventFeedbackDomain } from "../mappers/post-event-feedback.mapper";
import {
  PostEventFeedbackRepository,
  type UpsertPostEventFeedbackInput,
} from "./post-event-feedback.repository";

@Injectable()
export class PrismaPostEventFeedbackRepository implements PostEventFeedbackRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(eventId: string, input: UpsertPostEventFeedbackInput): Promise<PostEventFeedback> {
    const supplierPerformance = input.supplierPerformance as unknown as Prisma.InputJsonValue | undefined;
    const feedback = await this.prisma.postEventFeedback.upsert({
      where: { eventId },
      create: {
        eventId,
        whatDelighted: input.whatDelighted ?? undefined,
        setupAdjustments: input.setupAdjustments ?? undefined,
        supplierPerformance,
        whatWorkedForSpaceType: input.whatWorkedForSpaceType ?? undefined,
      },
      update: {
        whatDelighted: input.whatDelighted ?? undefined,
        setupAdjustments: input.setupAdjustments ?? undefined,
        supplierPerformance,
        whatWorkedForSpaceType: input.whatWorkedForSpaceType ?? undefined,
      },
    });
    return toPostEventFeedbackDomain(feedback);
  }

  async findByEvent(eventId: string): Promise<PostEventFeedback | null> {
    const feedback = await this.prisma.postEventFeedback.findUnique({ where: { eventId } });
    return feedback ? toPostEventFeedbackDomain(feedback) : null;
  }
}
