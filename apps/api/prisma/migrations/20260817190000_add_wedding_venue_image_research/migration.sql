CREATE TABLE "wedding_venue_image_research" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "venue_research_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "image_url" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "room_type" TEXT NOT NULL,
    "credit" TEXT,
    "rights_status" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "usage_scope" TEXT NOT NULL DEFAULT 'REFERENCE_ONLY',
    "approved_for_publication" BOOLEAN NOT NULL DEFAULT false,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "source_captured_at" TIMESTAMPTZ(6) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "wedding_venue_image_research_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "wedding_venue_image_research_venue_research_id_image_url_key"
    ON "wedding_venue_image_research"("venue_research_id", "image_url");

CREATE INDEX "wedding_venue_image_research_tenant_id_idx"
    ON "wedding_venue_image_research"("tenant_id");

CREATE INDEX "wedding_venue_image_research_organization_id_room_type_idx"
    ON "wedding_venue_image_research"("organization_id", "room_type");

CREATE INDEX "wedding_venue_image_research_venue_research_id_idx"
    ON "wedding_venue_image_research"("venue_research_id");

ALTER TABLE "wedding_venue_image_research"
    ADD CONSTRAINT "wedding_venue_image_research_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "wedding_venue_image_research"
    ADD CONSTRAINT "wedding_venue_image_research_venue_research_id_fkey"
    FOREIGN KEY ("venue_research_id") REFERENCES "wedding_venue_research"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
