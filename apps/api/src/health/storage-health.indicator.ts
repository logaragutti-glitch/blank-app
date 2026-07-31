import { Injectable } from "@nestjs/common";
import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from "@nestjs/terminus";
import { StoragePort } from "../infrastructure/storage/storage.port";

@Injectable()
export class StorageHealthIndicator extends HealthIndicator {
  constructor(private readonly storage: StoragePort) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.storage.ping();
      return this.getStatus(key, true);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new HealthCheckError("Storage check failed", this.getStatus(key, false, { message }));
    }
  }
}
