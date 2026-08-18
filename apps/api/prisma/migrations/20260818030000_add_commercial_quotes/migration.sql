-- CreateEnum
CREATE TYPE "CommercialQuoteStatus" AS ENUM ('DRAFT', 'RECEIVED', 'SELECTED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "commercial_quotes" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "commercial_proposal_id" UUID NOT NULL,
    "supplier_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "source" TEXT,
    "valid_until" TIMESTAMPTZ(6),
    "status" "CommercialQuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,

    CONSTRAINT "commercial_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "commercial_quotes_tenant_id_idx" ON "commercial_quotes"("tenant_id");
CREATE INDEX "commercial_quotes_organization_id_idx" ON "commercial_quotes"("organization_id");
CREATE INDEX "commercial_quotes_event_id_idx" ON "commercial_quotes"("event_id");
CREATE INDEX "commercial_quotes_commercial_proposal_id_idx" ON "commercial_quotes"("commercial_proposal_id");
CREATE INDEX "commercial_quotes_supplier_id_idx" ON "commercial_quotes"("supplier_id");

-- AddForeignKey
ALTER TABLE "commercial_quotes" ADD CONSTRAINT "commercial_quotes_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "commercial_quotes" ADD CONSTRAINT "commercial_quotes_commercial_proposal_id_fkey" FOREIGN KEY ("commercial_proposal_id") REFERENCES "commercial_proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "commercial_quotes" ADD CONSTRAINT "commercial_quotes_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
