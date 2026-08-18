-- AlterTable
ALTER TABLE "commercial_proposals"
ADD COLUMN "internal_cost" DECIMAL(12,2),
ADD COLUMN "margin_amount" DECIMAL(12,2),
ADD COLUMN "margin_percent" DECIMAL(7,2);
