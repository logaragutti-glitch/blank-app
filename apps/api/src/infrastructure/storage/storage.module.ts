import { Global, Module } from "@nestjs/common";
import { S3StorageService } from "./s3-storage.service";
import { StoragePort } from "./storage.port";

@Global()
@Module({
  providers: [{ provide: StoragePort, useClass: S3StorageService }],
  exports: [StoragePort],
})
export class StorageModule {}
