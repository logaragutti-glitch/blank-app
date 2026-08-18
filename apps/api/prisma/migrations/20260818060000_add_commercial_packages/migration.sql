-- AlterTable
ALTER TABLE "commercial_proposals"
ADD COLUMN "packages" JSONB NOT NULL DEFAULT '[]'::jsonb;
