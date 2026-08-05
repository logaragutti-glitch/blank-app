-- CreateEnum
CREATE TYPE "ProjectSupplierStatus" AS ENUM ('CONTACTED', 'NEGOTIATING', 'BOOKED', 'CANCELLED');

-- CreateTable: Fornecedores do Projeto — which Knowledge Graph Suppliers
-- are actually engaged for a given Event, and at what stage. Lightweight
-- join with metadata, same style as project_team_members.
CREATE TABLE "project_suppliers" (
    "event_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "status" "ProjectSupplierStatus" NOT NULL DEFAULT 'CONTACTED',
    "notes" TEXT,
    "added_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_suppliers_pkey" PRIMARY KEY ("event_id","supplier_id")
);

-- AddForeignKey
ALTER TABLE "project_suppliers" ADD CONSTRAINT "project_suppliers_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_suppliers" ADD CONSTRAINT "project_suppliers_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
