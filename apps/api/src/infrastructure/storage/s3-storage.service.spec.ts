import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import { S3StorageService } from "./s3-storage.service";

describe("S3StorageService", () => {
  const s3Mock = mockClient(S3Client);

  beforeEach(() => {
    s3Mock.reset();
    process.env.S3_BUCKET = "test-bucket";
  });

  it("uploads the object with the given key, body, and content type", async () => {
    s3Mock.on(PutObjectCommand).resolves({});
    const service = new S3StorageService();

    await service.upload({
      key: "inspiration/img-1.jpg",
      body: Buffer.from("fake-image-bytes"),
      contentType: "image/jpeg",
    });

    const calls = s3Mock.commandCalls(PutObjectCommand);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.args[0].input).toMatchObject({
      Bucket: "test-bucket",
      Key: "inspiration/img-1.jpg",
      ContentType: "image/jpeg",
    });
  });

  it("builds a time-limited signed GET URL for the given key", async () => {
    const service = new S3StorageService();

    const url = await service.getSignedDownloadUrl("renders/proposal-1/cover.png", 900);

    const parsed = new URL(url);
    expect(parsed.pathname).toContain("renders/proposal-1/cover.png");
    expect(parsed.searchParams.get("X-Amz-Expires")).toBe("900");
    expect(parsed.searchParams.has("X-Amz-Signature")).toBe(true);
  });
});
