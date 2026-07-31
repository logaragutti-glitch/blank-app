export interface UploadObjectParams {
  key: string;
  body: Buffer;
  contentType: string;
}

/** Port for S3-compatible object storage (MinIO locally, any S3-compatible service in production). */
export abstract class StoragePort {
  abstract upload(params: UploadObjectParams): Promise<void>;
  /** A time-limited GET URL — works regardless of the bucket's own ACL/policy, unlike a plain path-style URL. */
  abstract getSignedDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;
  /** The object's raw bytes — used when the caller needs to embed the data itself (e.g. a render inside a generated PDF), not just link to it. */
  abstract download(key: string): Promise<Buffer>;
}
