-- AlterTable
ALTER TABLE "commercial_proposals"
ADD COLUMN "logistics_items" JSONB NOT NULL DEFAULT '[]'::jsonb;
