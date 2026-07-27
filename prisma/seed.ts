import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: "mem-demo" },
    update: {},
    create: {
      name: "MEM Demo Produtora",
      slug: "mem-demo",
    },
  });

  const user = await prisma.user.upsert({
    where: { email: "demo@mem.technologies" },
    update: {},
    create: {
      name: "Usuário Demo",
      email: "demo@mem.technologies",
    },
  });

  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
    update: {},
    create: {
      userId: user.id,
      organizationId: org.id,
      role: "OWNER",
    },
  });

  console.log(`Seed concluído: organização "${org.name}" (${org.slug})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
