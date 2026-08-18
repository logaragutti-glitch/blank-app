CREATE TABLE "supplier_performance_reviews" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "overall_rating" INTEGER,
    "quality_rating" INTEGER,
    "punctuality_rating" INTEGER,
    "communication_rating" INTEGER,
    "scope_fulfillment" INTEGER,
    "notes" TEXT,
    CONSTRAINT "supplier_performance_reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "supplier_performance_reviews_event_id_supplier_id_key" ON "supplier_performance_reviews"("event_id", "supplier_id");
CREATE INDEX "supplier_performance_reviews_tenant_id_idx" ON "supplier_performance_reviews"("tenant_id");
CREATE INDEX "supplier_performance_reviews_organization_id_supplier_id_idx" ON "supplier_performance_reviews"("organization_id", "supplier_id");

ALTER TABLE "supplier_performance_reviews" ADD CONSTRAINT "supplier_performance_reviews_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "supplier_performance_reviews" ADD CONSTRAINT "supplier_performance_reviews_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
