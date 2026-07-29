# EVE OS

Enterprise platform monorepo. This repository is the implementation of the
EVE OS product, built to the standards defined by the project's official
documentation (Constitution, Product Specification, Architecture Book, AI
Bible, UI Bible, Engineering Handbook, Database Bible, API Bible, Roadmap).

> **Status**: Sprint 0 — monorepo, tooling, and local infrastructure
> scaffolding. No product/domain logic has been implemented yet.

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

1. Copies `.env.example` to `.env` on first run.
2. Starts Postgres (with pgvector), Redis, RabbitMQ, and OpenSearch via
   Docker Compose and waits for health checks.
3. Installs dependencies with pnpm if `node_modules` is missing.
4. Runs `turbo run dev`, starting the API, web, and admin apps in watch mode.

Once running:

- Web: http://localhost:3000
- Admin: http://localhost:3001
- API: http://localhost:4000 (Swagger docs at `/docs`, health check at `/health`)
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
| `pnpm format`         | Format the repo with Prettier                 |
| `pnpm infra:up`       | Start only the infra containers               |
| `pnpm infra:down`     | Stop the infra containers                     |

## Conventions

- Conventional Commits, enforced by commitlint + Husky `commit-msg` hook.
- Husky `pre-commit` hook runs lint/typecheck on affected packages.
- CI (`.github/workflows/ci.yml`) runs install, lint, typecheck, test, build
  on every push/PR to `main`.
- Database entities follow the Database Bible conventions: UUID primary
  keys, UTC timestamps, soft delete, audit trail, `tenant_id` /
  `organization_id`, optimistic-locking `version` column (see
  `packages/types/src/tenant.ts`).

## Next steps

Sprint 0 covers tooling and infrastructure only. Subsequent sprints will
implement the domain model, persistence layer (migrations), authentication/
RBAC, the AI agent layer, and the product UI, per the Architecture Book and
Roadmap.
