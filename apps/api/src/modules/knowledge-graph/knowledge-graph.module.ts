import { Module } from "@nestjs/common";
import { KnowledgeGraphController } from "./knowledge-graph.controller";
import { EventStyleRepository } from "./repositories/event-style.repository";
import { MaterialRepository } from "./repositories/material.repository";
import { PrismaEventStyleRepository } from "./repositories/prisma-event-style.repository";
import { PrismaMaterialRepository } from "./repositories/prisma-material.repository";
import { PrismaSupplierRepository } from "./repositories/prisma-supplier.repository";
import { PrismaVenueRepository } from "./repositories/prisma-venue.repository";
import { SupplierRepository } from "./repositories/supplier.repository";
import { VenueRepository } from "./repositories/venue.repository";

@Module({
  controllers: [KnowledgeGraphController],
  providers: [
    { provide: EventStyleRepository, useClass: PrismaEventStyleRepository },
    { provide: MaterialRepository, useClass: PrismaMaterialRepository },
    { provide: VenueRepository, useClass: PrismaVenueRepository },
    { provide: SupplierRepository, useClass: PrismaSupplierRepository },
  ],
  exports: [EventStyleRepository, MaterialRepository, VenueRepository, SupplierRepository],
})
export class KnowledgeGraphModule {}
