-- CreateEnum
CREATE TYPE "ClientInteractionType" AS ENUM ('CALL', 'MEETING', 'EMAIL', 'WHATSAPP', 'MILESTONE', 'NOTE', 'OTHER');

-- CreateTable: Timeline de Interações — a chronological log of real
-- contact with the couple, separate from Client.additional_details (a
-- point-in-time snapshot of the briefing answers).
CREATE TABLE "client_interactions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "type" "ClientInteractionType" NOT NULL,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL,
    "notes" TEXT NOT NULL,

    CONSTRAINT "client_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "client_interactions_tenant_id_idx" ON "client_interactions"("tenant_id");

-- CreateIndex
CREATE INDEX "client_interactions_client_id_idx" ON "client_interactions"("client_id");

-- AddForeignKey
ALTER TABLE "client_interactions" ADD CONSTRAINT "client_interactions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
