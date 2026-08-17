-- Research-backed wedding formats and trends catalog.
-- Source metadata is stored with each row so generated recommendations remain auditable.

CREATE TABLE "wedding_formats" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "axis" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "guest_min" INTEGER,
    "guest_max" INTEGER,
    "duration_min_days" INTEGER,
    "duration_max_days" INTEGER,
    "travel_required" BOOLEAN NOT NULL DEFAULT false,
    "ceremony_only" BOOLEAN NOT NULL DEFAULT false,
    "planning_notes" TEXT[] NOT NULL,
    "source_urls" TEXT[] NOT NULL,
    "source_notes" TEXT[] NOT NULL,
    "evidence" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "wedding_formats_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wedding_trends" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "application_notes" TEXT[] NOT NULL,
    "production_considerations" TEXT[] NOT NULL,
    "palette_colors" TEXT[] NOT NULL,
    "materials" TEXT[] NOT NULL,
    "source_urls" TEXT[] NOT NULL,
    "source_notes" TEXT[] NOT NULL,
    "evidence" JSONB,
    "source_date" DATE,
    "geography" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "wedding_trends_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wedding_format_trends" (
    "format_id" UUID NOT NULL,
    "trend_id" UUID NOT NULL,
    "fit_score" INTEGER NOT NULL,
    "rationale" TEXT NOT NULL,

    CONSTRAINT "wedding_format_trends_pkey" PRIMARY KEY ("format_id", "trend_id")
);

CREATE UNIQUE INDEX "wedding_formats_organization_id_slug_key" ON "wedding_formats"("organization_id", "slug");
CREATE INDEX "wedding_formats_tenant_id_idx" ON "wedding_formats"("tenant_id");
CREATE INDEX "wedding_formats_organization_id_axis_idx" ON "wedding_formats"("organization_id", "axis");

CREATE UNIQUE INDEX "wedding_trends_organization_id_slug_key" ON "wedding_trends"("organization_id", "slug");
CREATE INDEX "wedding_trends_tenant_id_idx" ON "wedding_trends"("tenant_id");
CREATE INDEX "wedding_trends_organization_id_category_idx" ON "wedding_trends"("organization_id", "category");

CREATE INDEX "wedding_format_trends_trend_id_idx" ON "wedding_format_trends"("trend_id");

ALTER TABLE "wedding_formats" ADD CONSTRAINT "wedding_formats_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "wedding_trends" ADD CONSTRAINT "wedding_trends_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "wedding_format_trends" ADD CONSTRAINT "wedding_format_trends_format_id_fkey" FOREIGN KEY ("format_id") REFERENCES "wedding_formats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "wedding_format_trends" ADD CONSTRAINT "wedding_format_trends_trend_id_fkey" FOREIGN KEY ("trend_id") REFERENCES "wedding_trends"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
