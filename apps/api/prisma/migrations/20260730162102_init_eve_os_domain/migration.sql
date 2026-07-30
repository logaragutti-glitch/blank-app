-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "SupplierCategory" AS ENUM ('FLORIST', 'CATERING', 'LIGHTING', 'FURNITURE_RENTAL', 'PHOTOGRAPHY', 'MUSIC', 'OTHER');

-- CreateEnum
CREATE TYPE "MaterialCategory" AS ENUM ('FLOWER', 'FABRIC', 'FURNITURE', 'LIGHTING', 'OTHER');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('WEDDING', 'CORPORATE', 'KIDS', 'DESTINATION', 'VENUE_MANAGED', 'HOTEL', 'CONVENTION');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'BRIEFING_CAPTURED', 'DIAGNOSED', 'PROPOSED', 'APPROVED', 'IN_PRODUCTION', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('DRAFT', 'INTERNAL_REVIEW', 'READY', 'SENT', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ComponentType" AS ENUM ('COVER', 'BIA_STORY', 'COUPLE_STORY', 'CONCEPT', 'MOODBOARD', 'PALETTE', 'ENTRANCE', 'CEREMONY', 'CAKE_TABLE', 'LOUNGE', 'GUEST_TABLES', 'BAR', 'BUFFET', 'DANCE_FLOOR', 'LIGHTING', 'FLORALS', 'TIMELINE', 'INVESTMENT');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "partner_one_name" TEXT NOT NULL,
    "partner_two_name" TEXT,
    "partner_one_profession" TEXT,
    "partner_two_profession" TEXT,
    "city" TEXT,
    "religion" TEXT,
    "hobbies" TEXT[],
    "how_they_met" TEXT,
    "proposal_story" TEXT,
    "family_tradition" TEXT,
    "lifestyle_tags" TEXT[],
    "likes_beach" BOOLEAN,
    "likes_countryside" BOOLEAN,
    "budget_amount" DECIMAL(12,2),
    "budget_currency" TEXT NOT NULL DEFAULT 'BRL',
    "dietary_restrictions" TEXT[],
    "accessibility_needs" TEXT,
    "additional_details" JSONB,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venues" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "structural_constraints" TEXT,
    "ceiling_height_meters" DECIMAL(4,2),
    "power_outlets" INTEGER,
    "guest_capacity" INTEGER,
    "existing_furniture" JSONB,
    "typical_climate" TEXT,
    "recommendation_notes" TEXT[],

    CONSTRAINT "venues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "category" "SupplierCategory" NOT NULL,
    "performance_notes" TEXT,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venue_preferred_suppliers" (
    "venue_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "notes" TEXT,

    CONSTRAINT "venue_preferred_suppliers_pkey" PRIMARY KEY ("venue_id","supplier_id")
);

-- CreateTable
CREATE TABLE "event_styles" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dimension_scores" JSONB NOT NULL,
    "palette_colors" TEXT[],
    "furniture_notes" TEXT[],
    "lounge_notes" TEXT[],

    CONSTRAINT "event_styles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "category" "MaterialCategory" NOT NULL,
    "emotions" TEXT[],
    "seasons" TEXT[],
    "never_recommend" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "type" "EventType" NOT NULL DEFAULT 'WEDDING',
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "client_id" UUID NOT NULL,
    "venue_id" UUID NOT NULL,
    "guests_expected" INTEGER,
    "ceremony_date_time" TIMESTAMPTZ(6),
    "budget_amount" DECIMAL(12,2),
    "dna_scores" JSONB,
    "genome" JSONB,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposals" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "event_id" UUID NOT NULL,
    "event_style_id" UUID,
    "diagnostico_criativo" JSONB NOT NULL,
    "concept_name" TEXT,
    "wow_score" DECIMAL(5,2),
    "status" "ProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "investment_amount" DECIMAL(12,2),

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_components" (
    "id" UUID NOT NULL,
    "proposal_id" UUID NOT NULL,
    "type" "ComponentType" NOT NULL,
    "order" INTEGER NOT NULL,
    "content" JSONB NOT NULL,

    CONSTRAINT "proposal_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_event_feedback" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "what_delighted" TEXT,
    "setup_adjustments" TEXT,
    "supplier_performance" JSONB,
    "what_worked_for_space_type" TEXT,

    CONSTRAINT "post_event_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MaterialCompatibleStyles" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_MaterialCompatibleStyles_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_MaterialIncompatibleStyles" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_MaterialIncompatibleStyles_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "organizations_tenant_id_idx" ON "organizations"("tenant_id");

-- CreateIndex
CREATE INDEX "clients_tenant_id_idx" ON "clients"("tenant_id");

-- CreateIndex
CREATE INDEX "clients_organization_id_idx" ON "clients"("organization_id");

-- CreateIndex
CREATE INDEX "venues_tenant_id_idx" ON "venues"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "venues_organization_id_name_key" ON "venues"("organization_id", "name");

-- CreateIndex
CREATE INDEX "suppliers_tenant_id_idx" ON "suppliers"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_organization_id_name_key" ON "suppliers"("organization_id", "name");

-- CreateIndex
CREATE INDEX "event_styles_tenant_id_idx" ON "event_styles"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_styles_organization_id_name_key" ON "event_styles"("organization_id", "name");

-- CreateIndex
CREATE INDEX "materials_tenant_id_idx" ON "materials"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "materials_organization_id_name_key" ON "materials"("organization_id", "name");

-- CreateIndex
CREATE INDEX "events_tenant_id_idx" ON "events"("tenant_id");

-- CreateIndex
CREATE INDEX "events_client_id_idx" ON "events"("client_id");

-- CreateIndex
CREATE INDEX "events_venue_id_idx" ON "events"("venue_id");

-- CreateIndex
CREATE INDEX "proposals_tenant_id_idx" ON "proposals"("tenant_id");

-- CreateIndex
CREATE INDEX "proposals_event_id_idx" ON "proposals"("event_id");

-- CreateIndex
CREATE INDEX "proposal_components_proposal_id_idx" ON "proposal_components"("proposal_id");

-- CreateIndex
CREATE UNIQUE INDEX "proposal_components_proposal_id_type_key" ON "proposal_components"("proposal_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "post_event_feedback_event_id_key" ON "post_event_feedback"("event_id");

-- CreateIndex
CREATE INDEX "_MaterialCompatibleStyles_B_index" ON "_MaterialCompatibleStyles"("B");

-- CreateIndex
CREATE INDEX "_MaterialIncompatibleStyles_B_index" ON "_MaterialIncompatibleStyles"("B");

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venues" ADD CONSTRAINT "venues_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venue_preferred_suppliers" ADD CONSTRAINT "venue_preferred_suppliers_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venue_preferred_suppliers" ADD CONSTRAINT "venue_preferred_suppliers_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_styles" ADD CONSTRAINT "event_styles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_event_style_id_fkey" FOREIGN KEY ("event_style_id") REFERENCES "event_styles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_components" ADD CONSTRAINT "proposal_components_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_event_feedback" ADD CONSTRAINT "post_event_feedback_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MaterialCompatibleStyles" ADD CONSTRAINT "_MaterialCompatibleStyles_A_fkey" FOREIGN KEY ("A") REFERENCES "event_styles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MaterialCompatibleStyles" ADD CONSTRAINT "_MaterialCompatibleStyles_B_fkey" FOREIGN KEY ("B") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MaterialIncompatibleStyles" ADD CONSTRAINT "_MaterialIncompatibleStyles_A_fkey" FOREIGN KEY ("A") REFERENCES "event_styles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MaterialIncompatibleStyles" ADD CONSTRAINT "_MaterialIncompatibleStyles_B_fkey" FOREIGN KEY ("B") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
