import { BadRequestException, Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/jwt-payload";
import { EventRepository } from "../briefing/repositories/event.repository";
import { SupplierRepository } from "../knowledge-graph/repositories/supplier.repository";
import { AddProjectSupplierDto } from "./dto/add-project-supplier.dto";
import { ProjectSupplierRepository } from "./repositories/project-supplier.repository";

// Fornecedores do Projeto (Bucket C) — which Knowledge Graph Suppliers are
// actually engaged for a given Event, and at what stage. Separate from
// Supplier.preferredVenueIds (a venue-level recommendation) and from
// BudgetAnalysis.bestValueSuppliers (an AI suggestion, not a confirmed
// hire) — this is the couple's real supplier lineup for this project.
@ApiTags("project-suppliers")
@ApiBearerAuth()
@Controller("events/:eventId/suppliers")
export class ProjectSuppliersController {
  constructor(
    private readonly events: EventRepository,
    private readonly assignments: ProjectSupplierRepository,
    private readonly suppliers: SupplierRepository,
  ) {}

  private async requireEvent(organizationId: string, eventId: string) {
    const event = await this.events.findById(organizationId, eventId);
    if (!event) throw new NotFoundException("Event not found");
    return event;
  }

  // Composed here (not stored) since the supplier's name/category belongs
  // to Supplier, not to the join record — same reasoning TeamController
  // uses to attach the assignee's name/e-mail.
  @Get()
  async listSuppliers(@CurrentUser() user: AuthenticatedUser, @Param("eventId") eventId: string) {
    await this.requireEvent(user.organizationId, eventId);
    const assignments = await this.assignments.findByEvent(eventId);

    return Promise.all(
      assignments.map(async (assignment) => {
        const supplier = await this.suppliers.findById(user.organizationId, assignment.supplierId);
        return {
          ...assignment,
          name: supplier?.name ?? "Fornecedor removido",
          category: supplier?.category ?? null,
        };
      }),
    );
  }

  @Post()
  async addSupplier(
    @CurrentUser() user: AuthenticatedUser,
    @Param("eventId") eventId: string,
    @Body() dto: AddProjectSupplierDto,
  ) {
    await this.requireEvent(user.organizationId, eventId);
    const supplier = await this.suppliers.findById(user.organizationId, dto.supplierId);
    if (!supplier) throw new BadRequestException("This supplier isn't in your organization's Knowledge Graph");

    const assignment = await this.assignments.addOrUpdate(eventId, {
      supplierId: dto.supplierId,
      status: dto.status ?? "CONTACTED",
      notes: dto.notes,
    });
    return { ...assignment, name: supplier.name, category: supplier.category };
  }

  @Delete(":supplierId")
  @HttpCode(204)
  async removeSupplier(
    @CurrentUser() user: AuthenticatedUser,
    @Param("eventId") eventId: string,
    @Param("supplierId") supplierId: string,
  ) {
    await this.requireEvent(user.organizationId, eventId);
    const existing = await this.assignments.findOne(eventId, supplierId);
    if (!existing) throw new NotFoundException("This supplier isn't assigned to this project");

    await this.assignments.remove(eventId, supplierId);
  }
}
