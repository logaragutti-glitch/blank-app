-- AlterTable
ALTER TABLE "materials" ADD COLUMN "estimated_unit_cost" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN "estimated_cost" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "budget_analyses" (
    "id" UUID NOT NULL,
    "proposal_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "line_items" JSONB NOT NULL,
    "best_value_suppliers" JSONB NOT NULL,
    "materials_cost" DECIMAL(12,2) NOT NULL,
    "suppliers_cost" DECIMAL(12,2) NOT NULL,
    "total_estimated_cost" DECIMAL(12,2) NOT NULL,
    "margin" DECIMAL(12,2),
    "fits_budget" BOOLEAN,
    "has_incomplete_data" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "budget_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "budget_analyses_proposal_id_key" ON "budget_analyses"("proposal_id");

-- AddForeignKey
ALTER TABLE "budget_analyses" ADD CONSTRAINT "budget_analyses_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
