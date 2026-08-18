-- CreateEnum
CREATE TYPE "CommercialPaymentStatus" AS ENUM ('PENDING', 'SCHEDULED', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateTable
CREATE TABLE "commercial_payments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "commercial_proposal_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "due_date" TIMESTAMPTZ(6) NOT NULL,
    "paid_at" TIMESTAMPTZ(6),
    "status" "CommercialPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "method" TEXT,
    "notes" TEXT,

    CONSTRAINT "commercial_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "commercial_payments_tenant_id_idx" ON "commercial_payments"("tenant_id");
CREATE INDEX "commercial_payments_organization_id_idx" ON "commercial_payments"("organization_id");
CREATE INDEX "commercial_payments_event_id_idx" ON "commercial_payments"("event_id");
CREATE INDEX "commercial_payments_commercial_proposal_id_idx" ON "commercial_payments"("commercial_proposal_id");
CREATE INDEX "commercial_payments_status_idx" ON "commercial_payments"("status");

-- AddForeignKey
ALTER TABLE "commercial_payments" ADD CONSTRAINT "commercial_payments_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "commercial_payments" ADD CONSTRAINT "commercial_payments_commercial_proposal_id_fkey" FOREIGN KEY ("commercial_proposal_id") REFERENCES "commercial_proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
