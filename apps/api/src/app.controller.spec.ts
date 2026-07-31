import { Test } from "@nestjs/testing";
import { HealthCheckService, MemoryHealthIndicator, PrismaHealthIndicator } from "@nestjs/terminus";
import { PrismaService } from "./infrastructure/prisma/prisma.service";
import { HealthController } from "./health/health.controller";
import { StorageHealthIndicator } from "./health/storage-health.indicator";

describe("HealthController", () => {
  it("reports ok when heap, database, and storage checks pass", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: { check: jest.fn().mockResolvedValue({ status: "ok" }) },
        },
        { provide: MemoryHealthIndicator, useValue: { checkHeap: jest.fn() } },
        { provide: PrismaHealthIndicator, useValue: { pingCheck: jest.fn() } },
        { provide: PrismaService, useValue: {} },
        { provide: StorageHealthIndicator, useValue: { isHealthy: jest.fn() } },
      ],
    }).compile();

    const controller = moduleRef.get(HealthController);
    await expect(controller.check()).resolves.toEqual({ status: "ok" });
  });
});
