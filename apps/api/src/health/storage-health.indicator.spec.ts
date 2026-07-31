import { HealthCheckError } from "@nestjs/terminus";
import type { StoragePort } from "../infrastructure/storage/storage.port";
import { StorageHealthIndicator } from "./storage-health.indicator";

describe("StorageHealthIndicator", () => {
  function makeStorage(ping: () => Promise<void>): StoragePort {
    return { upload: jest.fn(), getSignedDownloadUrl: jest.fn(), download: jest.fn(), ping } as unknown as StoragePort;
  }

  it("reports healthy when the storage ping succeeds", async () => {
    const indicator = new StorageHealthIndicator(makeStorage(() => Promise.resolve()));

    await expect(indicator.isHealthy("storage")).resolves.toEqual({ storage: { status: "up" } });
  });

  it("throws a HealthCheckError with the failure message when the ping fails", async () => {
    const indicator = new StorageHealthIndicator(makeStorage(() => Promise.reject(new Error("bucket unreachable"))));

    await expect(indicator.isHealthy("storage")).rejects.toThrow(HealthCheckError);
    try {
      await indicator.isHealthy("storage");
      fail("expected isHealthy to throw");
    } catch (error) {
      expect((error as HealthCheckError).causes).toEqual({
        storage: { status: "down", message: "bucket unreachable" },
      });
    }
  });
});
