-- CreateTable
CREATE TABLE "production_plans" (
    "id" UUID NOT NULL,
    "proposal_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "materials_list" JSONB NOT NULL,
    "setup_schedule" JSONB NOT NULL,
    "checklist" JSONB NOT NULL,

    CONSTRAINT "production_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "production_plans_proposal_id_key" ON "production_plans"("proposal_id");

-- AddForeignKey
ALTER TABLE "production_plans" ADD CONSTRAINT "production_plans_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
