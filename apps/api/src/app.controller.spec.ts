import { Test } from "@nestjs/testing";
import { HealthCheckService, MemoryHealthIndicator } from "@nestjs/terminus";
import { HealthController } from "./health/health.controller";

describe("HealthController", () => {
  it("reports ok when heap check passes", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: { check: jest.fn().mockResolvedValue({ status: "ok" }) },
        },
        { provide: MemoryHealthIndicator, useValue: { checkHeap: jest.fn() } },
      ],
    }).compile();

    const controller = moduleRef.get(HealthController);
    await expect(controller.check()).resolves.toEqual({ status: "ok" });
  });
});
