-- CreateEnum
CREATE TYPE "InspirationImageStatus" AS ENUM ('PENDING', 'ANALYZED', 'FAILED');

-- CreateTable
CREATE TABLE "inspiration_images" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "storage_key" TEXT NOT NULL,
    "original_filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "status" "InspirationImageStatus" NOT NULL DEFAULT 'PENDING',
    "vision_tags" JSONB,
    "vision_description" TEXT,
    "processing_error" TEXT,
    "embedding" vector(1536),

    CONSTRAINT "inspiration_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inspiration_images_tenant_id_idx" ON "inspiration_images"("tenant_id");

-- CreateIndex
CREATE INDEX "inspiration_images_event_id_idx" ON "inspiration_images"("event_id");

-- AddForeignKey
ALTER TABLE "inspiration_images" ADD CONSTRAINT "inspiration_images_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
