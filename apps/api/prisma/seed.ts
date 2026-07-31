// Seeds the Knowledge Graph with the concrete examples documented in
// docs/05-database-bible.md and docs/02-brand-bible.md, plus the
// Karen & Daniel / Villa Massari example that originated this project
// (see docs/03-product-spec.md).
import { PrismaPg } from "@prisma/adapter-pg";
import { MaterialCategory, PrismaClient, SupplierCategory } from "@prisma/client";

try {
  process.loadEnvFile(new URL("../.env", import.meta.url));
} catch {
  // .env is optional (e.g. when DATABASE_URL is provided by the shell/CI)
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Tia Bia Festas",
    },
  });

  const organization = await prisma.organization.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      tenantId: tenant.id,
      name: "Tia Bia Festas",
    },
  });

  const tenantId = tenant.id;
  const organizationId = organization.id;

  // --- Knowledge Graph: estilos --------------------------------------------

  const gardenFineArt = await prisma.eventStyle.upsert({
    where: { organizationId_name: { organizationId, name: "Garden Fine Art" } },
    update: {},
    create: {
      tenantId,
      organizationId,
      name: "Garden Fine Art",
      // Scores de exemplo documentados em 05-database-bible.md; a sessão
      // original não vinculou explicitamente os dois valores a um estilo
      // nomeado — atribuídos aqui ao Garden Fine Art por ser o único
      // estilo detalhado com ficha completa no material recebido.
      dimensionScores: { Luxuoso: 8.0, Natural: 7.8 },
      paletteColors: ["rosé", "verde sálvia", "champagne"],
      furnitureNotes: ["madeira clara", "ferro branco"],
      loungeNotes: ["fibra natural", "linho"],
    },
  });

  // Estilos citados apenas como "incompatível com" na ficha da Peônia,
  // sem ficha própria documentada — criados como placeholders mínimos
  // para que a relação de incompatibilidade seja representável e
  // consultável, sem inventar pontuações que não foram documentadas.
  const [futurista, industrial] = await Promise.all([
    prisma.eventStyle.upsert({
      where: { organizationId_name: { organizationId, name: "Futurista" } },
      update: {},
      create: { tenantId, organizationId, name: "Futurista", dimensionScores: {} },
    }),
    prisma.eventStyle.upsert({
      where: { organizationId_name: { organizationId, name: "Industrial" } },
      update: {},
      create: { tenantId, organizationId, name: "Industrial", dimensionScores: {} },
    }),
  ]);

  // --- Knowledge Graph: materiais -------------------------------------------

  await prisma.material.upsert({
    where: { organizationId_name: { organizationId, name: "Peônia" } },
    update: {},
    create: {
      tenantId,
      organizationId,
      name: "Peônia",
      category: MaterialCategory.FLOWER,
      emotions: ["Romance", "Abundância", "Delicadeza"],
      seasons: ["Primavera"],
      // Custo estimado por buquê médio (BRL) — usado pelo Agente 4
      // (04-ai-bible.md) para orçamento/margem.
      estimatedUnitCost: 45,
      compatibleStyles: { connect: [{ id: gardenFineArt.id }] },
      incompatibleStyles: { connect: [{ id: futurista.id }, { id: industrial.id }] },
    },
  });

  await prisma.material.upsert({
    where: { organizationId_name: { organizationId, name: "Lisianthus" } },
    update: {},
    create: {
      tenantId,
      organizationId,
      name: "Lisianthus",
      category: MaterialCategory.FLOWER,
      emotions: [],
      seasons: [],
      compatibleStyles: { connect: [{ id: gardenFineArt.id }] },
    },
  });

  await prisma.material.upsert({
    where: { organizationId_name: { organizationId, name: "Rosa Inglesa" } },
    update: {},
    create: {
      tenantId,
      organizationId,
      name: "Rosa Inglesa",
      category: MaterialCategory.FLOWER,
      emotions: [],
      seasons: [],
      compatibleStyles: { connect: [{ id: gardenFineArt.id }] },
    },
  });

  // A Bia sempre troca Tulipas por Lisianthus (04-ai-bible.md) — mantida no
  // catálogo para que esse padrão de aprendizado seja consultável/rastreável,
  // sem vínculo de compatibilidade de estilo (está sendo deliberadamente
  // substituída, não recomendada ativamente).
  await prisma.material.upsert({
    where: { organizationId_name: { organizationId, name: "Tulipa" } },
    update: {},
    create: {
      tenantId,
      organizationId,
      name: "Tulipa",
      category: MaterialCategory.FLOWER,
      emotions: [],
      seasons: [],
    },
  });

  for (const name of ["Gaze", "Organza", "Linho"]) {
    await prisma.material.upsert({
      where: { organizationId_name: { organizationId, name } },
      update: {},
      create: {
        tenantId,
        organizationId,
        name,
        category: MaterialCategory.FABRIC,
        emotions: [],
        seasons: [],
        compatibleStyles: { connect: [{ id: gardenFineArt.id }] },
      },
    });
  }

  for (const name of ["Madeira Clara", "Ferro Branco", "Fibra Natural"]) {
    await prisma.material.upsert({
      where: { organizationId_name: { organizationId, name } },
      update: {},
      create: {
        tenantId,
        organizationId,
        name,
        category: MaterialCategory.FURNITURE,
        emotions: [],
        seasons: [],
        compatibleStyles: { connect: [{ id: gardenFineArt.id }] },
      },
    });
  }

  // Lista "Não utilizar" (05-database-bible.md) — nunca devem ser sugeridos.
  await prisma.material.upsert({
    where: { organizationId_name: { organizationId, name: "Neon" } },
    update: {},
    create: {
      tenantId,
      organizationId,
      name: "Neon",
      category: MaterialCategory.LIGHTING,
      emotions: [],
      seasons: [],
      neverRecommend: true,
    },
  });

  await prisma.material.upsert({
    where: { organizationId_name: { organizationId, name: "Acrílico Colorido" } },
    update: {},
    create: {
      tenantId,
      organizationId,
      name: "Acrílico Colorido",
      category: MaterialCategory.OTHER,
      emotions: [],
      seasons: [],
      neverRecommend: true,
    },
  });

  await prisma.material.upsert({
    where: { organizationId_name: { organizationId, name: "LED RGB" } },
    update: {},
    create: {
      tenantId,
      organizationId,
      name: "LED RGB",
      category: MaterialCategory.LIGHTING,
      emotions: [],
      seasons: [],
      neverRecommend: true,
    },
  });

  // --- Venue: Villa Massari --------------------------------------------------

  const villaMassari = await prisma.venue.upsert({
    where: { organizationId_name: { organizationId, name: "Villa Massari" } },
    update: {},
    create: {
      tenantId,
      organizationId,
      name: "Villa Massari",
      recommendationNotes: [
        "cerimônia externa",
        "aproveitar a arquitetura",
        "iluminação quente",
        "flores em tons suaves",
      ],
    },
  });

  // --- Fornecedor preferencial da Villa Massari -------------------------------

  await prisma.supplier.upsert({
    where: { organizationId_name: { organizationId, name: "Flores da Serra" } },
    update: {},
    create: {
      tenantId,
      organizationId,
      name: "Flores da Serra",
      category: SupplierCategory.FLORIST,
      performanceNotes: "Entrega sempre pontual, bom custo-benefício para flores de estação.",
      // Custo estimado para contratação num evento típico (BRL) — usado
      // pelo Agente 4 (04-ai-bible.md) para orçamento/custo-benefício.
      estimatedCost: 3800,
      venues: { create: [{ venueId: villaMassari.id, notes: "Fornecedor preferencial para cerimônias externas." }] },
    },
  });

  await prisma.supplier.upsert({
    where: { organizationId_name: { organizationId, name: "Equipe Raiz Montagens" } },
    update: {},
    create: {
      tenantId,
      organizationId,
      name: "Equipe Raiz Montagens",
      category: SupplierCategory.ASSEMBLY_CREW,
      performanceNotes: "Equipe experiente com o terreno irregular da Villa Massari, monta e desmonta no mesmo dia.",
      // Custo estimado de mão de obra (montagem + desmontagem, BRL) para um
      // evento típico — usado pelo Agente 4 para orçamento/custo-benefício,
      // mesmo mecanismo já usado para as demais categorias de fornecedor.
      estimatedCost: 2400,
      venues: { create: [{ venueId: villaMassari.id, notes: "Equipe preferencial pela familiaridade com o espaço." }] },
    },
  });

  // --- Cliente e evento de origem: Karen & Daniel -----------------------------
  // O orçamento real que originou este projeto (docs/README.md, seção "Origem").

  let karenAndDaniel = await prisma.client.findFirst({
    where: { organizationId, partnerOneName: "Karen", partnerTwoName: "Daniel" },
  });
  if (!karenAndDaniel) {
    karenAndDaniel = await prisma.client.create({
      data: {
        tenantId,
        organizationId,
        partnerOneName: "Karen",
        partnerTwoName: "Daniel",
      },
    });
  }

  const existingEvent = await prisma.event.findFirst({
    where: { organizationId, clientId: karenAndDaniel.id, venueId: villaMassari.id },
  });
  if (!existingEvent) {
    await prisma.event.create({
      data: {
        tenantId,
        organizationId,
        clientId: karenAndDaniel.id,
        venueId: villaMassari.id,
        guestsExpected: 100,
        ceremonyDateTime: new Date("2027-08-07T16:30:00Z"),
        budgetAmount: 26770.0,
      },
    });
  }

  console.log("Seed concluído.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
