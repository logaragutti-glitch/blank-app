-- CreateTable: Arquivos do Projeto — a generic file attached to an Event
-- (contract, floor plan, supplier quote, etc.), reusing the same
-- StoragePort/bucket already used by InspirationImage but with no vision
-- analysis or embedding, since these aren't decoration photos.
CREATE TABLE "project_files" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
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

    CONSTRAINT "project_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_files_tenant_id_idx" ON "project_files"("tenant_id");

-- CreateIndex
CREATE INDEX "project_files_event_id_idx" ON "project_files"("event_id");

-- AddForeignKey
ALTER TABLE "project_files" ADD CONSTRAINT "project_files_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
