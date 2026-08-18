-- CreateEnum
CREATE TYPE "CommercialApprovalDecision" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "commercial_approval_links" (
    "id" UUID NOT NULL,
    "commercial_proposal_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "last_accessed_at" TIMESTAMPTZ(6),
    "decided_at" TIMESTAMPTZ(6),
    "decision" "CommercialApprovalDecision" NOT NULL DEFAULT 'PENDING',
    "recipient_name" TEXT,
    "recipient_email" TEXT,

    CONSTRAINT "commercial_approval_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "commercial_approval_links_token_hash_key" ON "commercial_approval_links"("token_hash");
CREATE INDEX "commercial_approval_links_commercial_proposal_id_idx" ON "commercial_approval_links"("commercial_proposal_id");
CREATE INDEX "commercial_approval_links_expires_at_idx" ON "commercial_approval_links"("expires_at");

-- AddForeignKey
ALTER TABLE "commercial_approval_links" ADD CONSTRAINT "commercial_approval_links_commercial_proposal_id_fkey" FOREIGN KEY ("commercial_proposal_id") REFERENCES "commercial_proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
