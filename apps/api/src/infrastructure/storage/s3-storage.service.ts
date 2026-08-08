import { Injectable } from "@nestjs/common";
import { GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { StoragePort, type UploadObjectParams } from "./storage.port";

const DEFAULT_SIGNED_URL_EXPIRY_SECONDS = 3600;

@Injectable()
export class S3StorageService implements StoragePort {
  private readonly client: S3Client;
  // A signed download URL is handed to the browser, not used by this
  // server process — so it must be built against a host the browser can
  // actually reach. In Docker Compose, `S3_ENDPOINT` is the internal
  // service name (`http://minio:9000`), resolvable only inside the
  // Docker network; the API container reaches MinIO through it just
  // fine, but a `<img src="...">` on the user's machine can't resolve
  // `minio` at all, so every conceptual render silently failed to load
  // even though the file itself was uploaded correctly. `S3_PUBLIC_ENDPOINT`
  // (the same MinIO port, but published to `localhost`) is what the
  // signature and Host header get built against instead. Falls back to
  // `S3_ENDPOINT` when unset, so local `pnpm dev` (where both already
  // point at the same localhost address) and the tests are unaffected.
  private readonly publicClient: S3Client;
  private readonly bucket: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET ?? "eve-os-inspiration";
    const credentials = {
      accessKeyId: process.env.S3_ACCESS_KEY ?? "",
      secretAccessKey: process.env.S3_SECRET_KEY ?? "",
    };
    this.client = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION ?? "us-east-1",
      forcePathStyle: true, // required for MinIO and most non-AWS S3-compatible services
      credentials,
    });
    this.publicClient = new S3Client({
      endpoint: process.env.S3_PUBLIC_ENDPOINT ?? process.env.S3_ENDPOINT,
      region: process.env.S3_REGION ?? "us-east-1",
      forcePathStyle: true,
      credentials,
    });
  }

  async upload({ key, body, contentType }: UploadObjectParams): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async getSignedDownloadUrl(
    key: string,
    expiresInSeconds: number = DEFAULT_SIGNED_URL_EXPIRY_SECONDS,
  ): Promise<string> {
    return getSignedUrl(this.publicClient, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn: expiresInSeconds,
    });
  }

  async download(key: string): Promise<Buffer> {
    const response = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    const bytes = await response.Body?.transformToByteArray();
    if (!bytes) throw new Error(`Empty response body for storage key: ${key}`);
    return Buffer.from(bytes);
  }

  async ping(): Promise<void> {
    await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
  }
}
