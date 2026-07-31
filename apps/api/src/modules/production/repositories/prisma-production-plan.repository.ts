import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { ProductionPlan } from "@eve-os/types";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service";
import { toProductionPlanDomain } from "../mappers/production-plan.mapper";
import type { ProductionPlanResult } from "../ai/production-plan.port";
import { ProductionPlanRepository } from "./production-plan.repository";

@Injectable()
export class PrismaProductionPlanRepository implements ProductionPlanRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(proposalId: string, input: ProductionPlanResult): Promise<ProductionPlan> {
    const materialsList = input.materialsList as unknown as Prisma.InputJsonValue;
    const setupSchedule = input.setupSchedule as unknown as Prisma.InputJsonValue;
    const checklist = input.checklist as unknown as Prisma.InputJsonValue;

    const plan = await this.prisma.productionPlan.upsert({
      where: { proposalId },
      create: { proposalId, materialsList, setupSchedule, checklist },
      update: { materialsList, setupSchedule, checklist },
    });
    return toProductionPlanDomain(plan);
  }

  async findByProposal(proposalId: string): Promise<ProductionPlan | null> {
    const plan = await this.prisma.productionPlan.findUnique({ where: { proposalId } });
    return plan ? toProductionPlanDomain(plan) : null;
  }
}
