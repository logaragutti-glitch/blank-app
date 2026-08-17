-- CreateTable
CREATE TABLE "wedding_venue_research" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "name" TEXT NOT NULL,
    "municipality" TEXT NOT NULL,
    "venue_type" TEXT NOT NULL,
    "evidence_level" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUIRES_CONFIRMATION',
    "capacity_min" INTEGER,
    "capacity_max" INTEGER,
    "lodging_capacity" INTEGER,
    "price_note" TEXT,
    "services" TEXT[] NOT NULL,
    "source_urls" TEXT[] NOT NULL,
    "contact" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "wedding_venue_research_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wedding_venue_research_organization_id_name_key" ON "wedding_venue_research"("organization_id", "name");
CREATE INDEX "wedding_venue_research_tenant_id_idx" ON "wedding_venue_research"("tenant_id");
CREATE INDEX "wedding_venue_research_organization_id_municipality_idx" ON "wedding_venue_research"("organization_id", "municipality");

-- AddForeignKey
ALTER TABLE "wedding_venue_research" ADD CONSTRAINT "wedding_venue_research_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
