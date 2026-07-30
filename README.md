# EVE OS

Event Intelligence Operating System — a monorepo for the platform that
turns a wedding/event brief and inspiration photos into a fully
personalized creative proposal, built on the Tia Bia Festas / Método Bia
Azevedo methodology.

This repository is the implementation of the EVE OS product, built to the
standards defined by the project's official documentation, which lives in
[`docs/`](./docs/README.md): Constitution, Brand Bible, Product
Specification, AI Bible, Database Bible, UI Bible, Architecture Book, and
Roadmap. When in doubt about domain behavior, `docs/` is the source of
truth — read it before adding product logic.

> **Status**: Sprint 1 — the Knowledge Graph domain (event styles,
> materials, venues) is modeled in Postgres via Prisma migrations and
> seeded with the examples from the Bibles, exposed through read-only API
> endpoints. Sprint 0 (monorepo/tooling/infra) is complete.

## Stack

| Layer         | Technology                                   |
| ------------- | --------------------------------------------- |
| Backend       | NestJS, TypeScript                            |
| Frontend      | Next.js, React, TypeScript                    |
| Mobile        | React Native (Expo), TypeScript                |
| Database      | PostgreSQL + pgvector                          |
| Cache         | Redis                                          |
| Search        | OpenSearch                                     |
| Messaging     | RabbitMQ                                       |
| Storage       | S3-compatible object storage                   |
| Infra         | Docker, Docker Compose, Kubernetes, GitHub Actions |

## Monorepo layout

```
apps/
  web/       Next.js customer-facing app       (port 3000)
  admin/     Next.js admin console              (port 3001)
  api/       NestJS backend API                 (port 4000)
  mobile/    React Native (Expo) app
packages/
  ui/        Shared React component library and design tokens
  types/     Shared TypeScript types/DTOs (multi-tenant, audited entities)
  utils/     Shared utility functions
  config/    Shared ESLint presets and tsconfig bases
infra/
  docker/    Service init scripts (e.g. Postgres extensions)
scripts/
  dev.sh     Single-command local bootstrap
```

Managed with **pnpm workspaces** + **Turborepo**.

## Prerequisites

- Node.js >= 20
- pnpm >= 9 (`corepack enable` will provide it)
- Docker + Docker Compose

## Run everything with one command

```bash
pnpm dev
```

This runs `scripts/dev.sh`, which:

1. Copies `.env.example` to `.env` on first run (root and `apps/api`).
2. Starts Postgres (with pgvector), Redis, RabbitMQ, and OpenSearch via
   Docker Compose and waits for health checks.
3. Installs dependencies with pnpm if `node_modules` is missing.
4. Applies Prisma migrations and seeds the Knowledge Graph.
5. Runs `turbo run dev`, starting the API, web, and admin apps in watch mode.

Once running:

- Web: http://localhost:3000
- Admin: http://localhost:3001
- API: http://localhost:4000 (Swagger docs at `/docs`, health check at
  `/health`, Knowledge Graph reads at `/knowledge-graph/{styles,materials,venues}`)
- RabbitMQ management UI: http://localhost:15672
- OpenSearch: http://localhost:9200

For the mobile app, run separately: `pnpm --filter @eve-os/mobile dev` (Expo).

To run the full stack containerized instead (including apps), use:

```bash
docker compose --profile full up -d --build
```

## Common scripts

| Command              | Description                                  |
| --------------------- | --------------------------------------------- |
| `pnpm dev`            | Single-command local bootstrap (see above)    |
| `pnpm build`          | Build all apps/packages via Turborepo         |
| `pnpm lint`           | Lint all apps/packages                        |
| `pnpm typecheck`      | Type-check all apps/packages                  |
| `pnpm test`           | Run unit tests across the monorepo            |
| `pnpm test:e2e`       | Run e2e tests (needs a running Postgres, see below) |
| `pnpm format`         | Format the repo with Prettier                 |
| `pnpm infra:up`       | Start only the infra containers               |
| `pnpm infra:down`     | Stop the infra containers                     |

## Database (Prisma)

The domain schema lives in `apps/api/prisma/schema.prisma`. Common commands
(run from `apps/api`, with `DATABASE_URL` set — see `apps/api/.env.example`):

| Command                              | Description                                |
| ------------------------------------- | ------------------------------------------- |
| `npx prisma migrate dev --name <x>`   | Create and apply a new migration (local dev) |
| `npx prisma migrate deploy`           | Apply pending migrations (CI/production)     |
| `npx prisma db seed`                  | Seed the Knowledge Graph (idempotent)        |
| `npx prisma studio`                   | Browse the database in a local GUI           |

Prisma 7 reads datasource config from `apps/api/prisma.config.ts`, not from
`schema.prisma`, and `PrismaClient` requires a driver adapter
(`@prisma/adapter-pg`) — see `src/infrastructure/prisma/prisma.service.ts`.

## Conventions

- Conventional Commits, enforced by commitlint + Husky `commit-msg` hook.
- Husky `pre-commit` hook runs lint/typecheck on affected packages.
- CI (`.github/workflows/ci.yml`) runs install, lint, typecheck, test, build,
  then applies migrations/seed against a Postgres+pgvector service
  container and runs e2e tests, on every push/PR to `main`.
- Database entities follow the Database Bible conventions: UUID primary
  keys, UTC timestamps, soft delete, audit trail, `tenant_id` /
  `organization_id`, optimistic-locking `version` column (see
  `packages/types/src/tenant.ts`).

## Next steps

Sprint 1 covers the Knowledge Graph domain and read-only API only — no
Briefing/Creative Engine, no auth/RBAC, no product UI yet. Subsequent
sprints will implement briefing capture, the Diagnostico Criativo, the AI
agent layer, and the product UI, per `docs/08-roadmap.md`.
