export interface UploadObjectParams {
  key: string;
  body: Buffer;
  contentType: string;
}

/** Port for S3-compatible object storage (MinIO locally, any S3-compatible service in production). */
export abstract class StoragePort {
  abstract upload(params: UploadObjectParams): Promise<void>;
}
