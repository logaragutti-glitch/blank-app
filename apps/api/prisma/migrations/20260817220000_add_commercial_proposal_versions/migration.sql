ALTER TYPE "CommercialProposalStatus" ADD VALUE 'REJECTED';

CREATE TYPE "CommercialProposalVersionAction" AS ENUM ('CREATED', 'UPDATED', 'READY', 'SENT', 'APPROVED', 'REJECTED');

ALTER TABLE "commercial_proposals"
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "sent_at" TIMESTAMPTZ(6),
  ADD COLUMN "sent_by" UUID,
  ADD COLUMN "approved_at" TIMESTAMPTZ(6),
  ADD COLUMN "approved_by" UUID,
  ADD COLUMN "rejection_reason" TEXT;

CREATE TABLE "commercial_proposal_versions" (
  "id" UUID NOT NULL,
  "commercial_proposal_id" UUID NOT NULL,
  "version" INTEGER NOT NULL,
  "action" "CommercialProposalVersionAction" NOT NULL,
  "status" "CommercialProposalStatus" NOT NULL,
  "total_investment" DECIMAL(12,2) NOT NULL,
  "snapshot" JSONB NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" UUID,

  CONSTRAINT "commercial_proposal_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "commercial_proposal_versions_commercial_proposal_id_version_key"
  ON "commercial_proposal_versions"("commercial_proposal_id", "version");
CREATE INDEX "commercial_proposal_versions_commercial_proposal_id_idx"
  ON "commercial_proposal_versions"("commercial_proposal_id");

ALTER TABLE "commercial_proposal_versions"
  ADD CONSTRAINT "commercial_proposal_versions_commercial_proposal_id_fkey"
  FOREIGN KEY ("commercial_proposal_id") REFERENCES "commercial_proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "commercial_proposal_versions" (
  "id",
  "commercial_proposal_id",
  "version",
  "action",
  "status",
  "total_investment",
  "snapshot",
  "notes",
  "created_by"
)
SELECT
  uuid_generate_v4(),
  cp."id",
  cp."version",
  'CREATED',
  cp."status",
  cp."total_investment",
  jsonb_build_object(
    'eventSnapshot', cp."event_snapshot",
    'venueSnapshot', cp."venue_snapshot",
    'supplierSelections', cp."supplier_selections",
    'lineItems', cp."line_items",
    'subtotal', cp."subtotal",
    'contingencyAmount', cp."contingency_amount",
    'managementFee', cp."management_fee",
    'discount', cp."discount",
    'totalInvestment', cp."total_investment",
    'validityDays', cp."validity_days",
    'validUntil', cp."valid_until",
    'approvalDeadline', cp."approval_deadline",
    'paymentTerms', cp."payment_terms",
    'conditions', cp."conditions",
    'nextSteps', cp."next_steps",
    'commercialNotes', cp."commercial_notes",
    'hasUnconfirmedData', cp."has_unconfirmed_data",
    'sentAt', cp."sent_at",
    'sentBy', cp."sent_by",
    'approvedAt', cp."approved_at",
    'approvedBy', cp."approved_by",
    'rejectionReason', cp."rejection_reason"
  ),
  'Snapshot inicial criado pela migration de histórico comercial',
  NULL
FROM "commercial_proposals" cp;
