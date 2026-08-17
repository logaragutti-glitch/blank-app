CREATE TYPE "CommercialProposalStatus" AS ENUM ('DRAFT', 'READY', 'SENT', 'APPROVED', 'EXPIRED');

CREATE TABLE "commercial_proposals" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "proposal_id" UUID NOT NULL,
  "event_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  "status" "CommercialProposalStatus" NOT NULL DEFAULT 'DRAFT',
  "event_snapshot" JSONB NOT NULL,
  "venue_snapshot" JSONB NOT NULL,
  "supplier_selections" JSONB NOT NULL,
  "line_items" JSONB NOT NULL,
  "subtotal" DECIMAL(12,2) NOT NULL,
  "contingency_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "management_fee" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "total_investment" DECIMAL(12,2) NOT NULL,
  "validity_days" INTEGER NOT NULL DEFAULT 10,
  "valid_until" TIMESTAMPTZ(6),
  "approval_deadline" TIMESTAMPTZ(6),
  "payment_terms" JSONB NOT NULL,
  "conditions" TEXT[] NOT NULL,
  "next_steps" TEXT[] NOT NULL,
  "commercial_notes" TEXT,
  "has_unconfirmed_data" BOOLEAN NOT NULL DEFAULT true,

  CONSTRAINT "commercial_proposals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "commercial_proposals_proposal_id_key" ON "commercial_proposals"("proposal_id");
CREATE INDEX "commercial_proposals_tenant_id_idx" ON "commercial_proposals"("tenant_id");
CREATE INDEX "commercial_proposals_organization_id_idx" ON "commercial_proposals"("organization_id");
CREATE INDEX "commercial_proposals_event_id_idx" ON "commercial_proposals"("event_id");

ALTER TABLE "commercial_proposals"
  ADD CONSTRAINT "commercial_proposals_proposal_id_fkey"
  FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "commercial_proposals"
  ADD CONSTRAINT "commercial_proposals_event_id_fkey"
  FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
