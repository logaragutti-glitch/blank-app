-- CreateEnum
CREATE TYPE "CommercialProposalScope" AS ENUM ('FULL_EVENT', 'DECORATION_ONLY');

-- AlterTable
ALTER TABLE "commercial_proposals"
ADD COLUMN "scope" "CommercialProposalScope" NOT NULL DEFAULT 'FULL_EVENT';
