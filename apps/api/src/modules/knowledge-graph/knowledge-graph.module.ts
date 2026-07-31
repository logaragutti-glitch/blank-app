import { Module } from "@nestjs/common";
import { KnowledgeGraphController } from "./knowledge-graph.controller";
import { EventStyleRepository } from "./repositories/event-style.repository";
import { MaterialRepository } from "./repositories/material.repository";
import { PrismaEventStyleRepository } from "./repositories/prisma-event-style.repository";
import { PrismaMaterialRepository } from "./repositories/prisma-material.repository";
import { PrismaVenueRepository } from "./repositories/prisma-venue.repository";
import { VenueRepository } from "./repositories/venue.repository";

@Module({
  controllers: [KnowledgeGraphController],
  providers: [
    { provide: EventStyleRepository, useClass: PrismaEventStyleRepository },
    { provide: MaterialRepository, useClass: PrismaMaterialRepository },
    { provide: VenueRepository, useClass: PrismaVenueRepository },
  ],
  exports: [EventStyleRepository, MaterialRepository, VenueRepository],
})
export class KnowledgeGraphModule {}
