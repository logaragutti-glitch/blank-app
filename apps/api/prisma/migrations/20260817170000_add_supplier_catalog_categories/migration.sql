-- CreateEnum
CREATE TYPE "SupplierCatalogCategoryType" AS ENUM ('FURNITURE', 'LIGHTING', 'DECOR', 'STRUCTURE', 'TEXTILE', 'ACCESSORY', 'OTHER');

-- CreateTable
CREATE TABLE "supplier_catalog_categories" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category_type" "SupplierCatalogCategoryType" NOT NULL,
    "listed_product_count" INTEGER,
    "source_url" TEXT NOT NULL,
    "product_names" TEXT[] NOT NULL,
    "extraction_status" TEXT NOT NULL,
    "notes" TEXT,
    "source_captured_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "supplier_catalog_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "supplier_catalog_categories_supplier_id_slug_key" ON "supplier_catalog_categories"("supplier_id", "slug");

-- CreateIndex
CREATE INDEX "supplier_catalog_categories_tenant_id_idx" ON "supplier_catalog_categories"("tenant_id");

-- CreateIndex
CREATE INDEX "supplier_catalog_categories_organization_id_category_type_idx" ON "supplier_catalog_categories"("organization_id", "category_type");

-- CreateIndex
CREATE INDEX "supplier_catalog_categories_supplier_id_idx" ON "supplier_catalog_categories"("supplier_id");

-- AddForeignKey
ALTER TABLE "supplier_catalog_categories" ADD CONSTRAINT "supplier_catalog_categories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_catalog_categories" ADD CONSTRAINT "supplier_catalog_categories_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
