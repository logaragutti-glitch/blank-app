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

> **Status**: Sprint 4 and real authentication/RBAC are complete — the
> Creative Engine generates the Diagnostico Criativo (Agente 1 / Motor de
> Interpretacao) from the briefing, analyzed inspiration images (narrowed
> via real pgvector semantic search), and the Knowledge Graph, persists it
> as a Proposal with a computed WOW Score, then generates the 18 reusable
> proposal components (Agente 3 / Creative Engine, Constitution Capitulo
> 7), and assembles them into a structured proposal document
> (`GET /creative/proposals/:proposalId/document`). Every business endpoint
> now requires a JWT (`POST /auth/register`, `POST /auth/login`) instead of
> caller-supplied `tenantId`/`organizationId` query params — see
> `docs/07-architecture-book.md`. Post-event feedback capture is also
> implemented (`POST`/`GET /events/:eventId/feedback`, see
> `docs/05-database-bible.md`), and automatically feeds back into the
> Knowledge Graph: a supplier rated 4-5 is promoted to preferred at that
> event's venue, 1-2 demotes it, deterministically (no AI involved) — see
> `docs/08-roadmap.md`. The 5 MVP product screens (`03-product-spec.md`)
> are built in `apps/web` — Home, Novo Projeto, Diagnóstico Criativo, Editor
> do Projeto, and Gerar Proposta — on top of the Brand/UI Bible design
> tokens (`packages/ui`). Conceptual renders (OpenAI `gpt-image-1`) are also
> implemented for the Capa and each of the 10 narrative environments
> (`POST /creative/proposals/:proposalId/render/:componentType`) — see
> `docs/04-ai-bible.md`. Production modules (Agente 4 / Diretor de
> Produção) are also implemented: `POST`/`GET /production/proposals/:proposalId/plan`
> generates a materials list, an assembly schedule, and an operational
> checklist from an already-diagnosed Proposal, with a matching `/producao`
> screen in `apps/web` — gated behind formal proposal approval
> (`POST /creative/proposals/:proposalId/approve`/`.../reject`, see
> `docs/08-roadmap.md`). Agente 4's budget analysis is also implemented:
> `POST`/`GET /production/proposals/:proposalId/budget-analysis` answers
> the budget/margin/best-value-supplier questions from `04-ai-bible.md` —
> the AI only estimates a material quantity, all cost math (unit cost,
> supplier ranking, margin, budget fit) is computed deterministically from
> real Knowledge Graph cost data (`Material.estimatedUnitCost`,
> `Supplier.estimatedCost`), read via `GET /knowledge-graph/suppliers`/
> `.../suppliers/:id`. Modo Produção is also implemented: the project hub
> (`/projects/:eventId`) changes shape once the proposal is approved —
> same data, not a new screen — to foreground the ceremony schedule,
> operational checklist, assembly schedule, and recommended suppliers
> (see `docs/06-ui-bible.md`). Manual field-by-field editing of a proposal
> component is also implemented: `PATCH /creative/proposals/:proposalId/components/:componentType`
> shallow-merges the given fields into a component's existing content
> (`/projects/:eventId/editor` gained an "Editar" button per component,
> with a form tailored to each component's own content shape). A real PDF
> artifact for the proposal is also implemented:
> `GET /creative/proposals/:proposalId/document/pdf` (via `pdfkit`) renders
> the same ordered components as the JSON document into an actual
> downloadable file, embedding any conceptual renders already generated
> (`/projects/:eventId/proposta` gained a "Baixar PDF" button). A
> read-only Canvas do Evento is also implemented:
> `GET /projects/:eventId/canvas` assembles a real snapshot of everything
> already connected to the Event (Cliente, Espaço, Flores, Mobiliário,
> Luz, Música, Gastronomia, Experiência), narrowed by the Diagnostico
> Criativo when one exists — deliberately without the Rule Engine/Event
> Impact Engine's cascading recalculation, which would need real business
> rules that don't exist anywhere in the system yet
> (`/projects/:eventId/canvas` renders it as a radial node graph).
> `apps/admin` now has real screens too: manual Knowledge Graph management
> (`POST`/`PATCH /knowledge-graph/{styles,materials,venues,suppliers}[/:id]`,
> alongside the existing read-only API) — login, list, create, and edit
> screens for the 4 catalog entities. `apps/mobile` also has real screens
> now: a Modo Produção field app (login, project list, and project detail
> reusing the existing production plan endpoint — materials list, assembly
> schedule, operational checklist), with no session persisted between app
> opens and no external navigation library (only 3 screens, resolved with
> a simple state machine). Sprint 2
> (Briefing Engine:
> form capture + inspiration image ingestion), Sprint 1 (Knowledge Graph
> domain + read API), and Sprint 0 (monorepo/tooling/infra) are complete.

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
| Storage       | S3-compatible object storage (MinIO locally)  |
| AI (Vision)   | Anthropic Claude                              |
| AI (Embeddings)| OpenAI `text-embedding-3-small`              |
| AI (Images)   | OpenAI `gpt-image-1`                          |
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

1. Copies `.env.example` to `.env`/`.env.local` on first run (root,
   `apps/api`, `apps/web`).
2. Starts Postgres (with pgvector), Redis, RabbitMQ, OpenSearch, and MinIO
   via Docker Compose and waits for health checks.
3. Installs dependencies with pnpm if `node_modules` is missing.
4. Applies Prisma migrations and seeds the Knowledge Graph.
5. Runs `turbo run dev`, starting the API, web, and admin apps in watch mode.

Once running:

- Web: http://localhost:3000 — the 5 MVP screens. Register at
  `/register` against the seeded organization id (`00000000-0000-0000-0000-000000000002`,
  see `apps/api/prisma/seed.ts`) to sign in.
- Admin: http://localhost:3001 — Knowledge Graph management (styles,
  materials, venues, suppliers). Log in with an account already registered
  via `apps/web` (`apps/admin` has no self-registration screen of its
  own).
- API: http://localhost:4000 (Swagger docs at `/docs`, health check at
  `/health`). Every other endpoint requires a Bearer token from
  `POST /auth/login` — Knowledge Graph reads at
  `/knowledge-graph/{styles,materials,venues,suppliers}`, and writes at
  `POST`/`PATCH /knowledge-graph/{styles,materials,venues,suppliers}[/:id]`,
  project listing at
  `GET /projects`, briefing capture at `POST /briefing`, inspiration
  images at `/briefing/:eventId/inspiration-images`, Diagnostico Criativo
  generation at `POST /creative/:eventId/diagnostico-criativo`, proposal
  components at `POST /creative/proposals/:proposalId/components`, the
  conceptual renders at `POST /creative/proposals/:proposalId/render/:componentType`
  (Capa or one of the 10 narrative environments), formal proposal approval
  at `POST /creative/proposals/:proposalId/{approve,reject}`, the
  production plan (materials list, assembly schedule, checklist — requires
  an approved proposal) at `/production/proposals/:proposalId/plan`, its
  budget analysis (materials/supplier cost, margin, budget fit — same
  approval gate) at `/production/proposals/:proposalId/budget-analysis`,
  the proposal's real PDF at `GET /creative/proposals/:proposalId/document/pdf`,
  the Canvas do Evento at `GET /projects/:eventId/canvas`, and post-event
  feedback at `/events/:eventId/feedback`.
- RabbitMQ management UI: http://localhost:15672
- OpenSearch: http://localhost:9200
- MinIO console: http://localhost:9001

Set `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` in `apps/api/.env` to enable
real image analysis/embeddings for the Briefing Engine — without them, the
Knowledge Graph and briefing-capture endpoints still work, but uploaded
images end up with `status: "FAILED"` and a clear `processingError`
instead of silently no-op'ing.

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

## Deploying to production

See [`docs/11-deployment-guide.md`](./docs/11-deployment-guide.md) for the
full runbook (Vercel for `apps/web`/`apps/admin`, a Dockerfile-based host
for `apps/api`, managed Postgres+pgvector, S3-compatible storage). Quick
summary for `apps/web`/`apps/admin` on Vercel: the Vercel project's "Root
Directory" (Project Settings → General) is set to `apps/web` or
`apps/admin`, with "Include files outside the Root Directory" enabled so
the build can see the internal workspace packages
(`transpilePackages: ["@eve-os/ui", "@eve-os/types"]` in each app's
`next.config.mjs`). Both apps' `vercel.json` pins `buildCommand` to plain
`next build` — with files outside the root visible, Vercel also sees
`apps/api/prisma/schema.prisma` and otherwise auto-injects `prisma migrate
deploy && next build` (a real Vercel heuristic for Prisma projects), which
fails since neither frontend has a `prisma` dependency or any business
running database migrations for a frontend deploy anyway.

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

Sprint 4 is complete: Diagnostico Criativo generation (with real pgvector
semantic search narrowing the candidate styles and an automatically
computed WOW Score), the 18 reusable proposal components (Capitulo 7),
and the assembled proposal document endpoint are all implemented.
Authentication/RBAC is also complete (see `docs/07-architecture-book.md`):
every business endpoint requires a JWT and derives `tenantId`/
`organizationId` from it. Structured post-event feedback capture (see
`docs/05-database-bible.md`) is implemented too. The 5 MVP product screens
are built in `apps/web` on the realigned Brand/UI Bible design tokens.
Conceptual renders (OpenAI `gpt-image-1`) are also implemented, covering
both the Capa and each of the 10 narrative environments. Production
modules (Agente 4 / Diretor de Produção) are implemented too: a materials
list, assembly schedule, and operational checklist generated from an
already-diagnosed Proposal. A formal proposal-approval flow
(`POST /creative/proposals/:proposalId/approve`/`.../reject`) gates
production-artifact generation. A real Supplier read API
(`GET /knowledge-graph/suppliers`/`.../suppliers/:id`) and Agente 4's
budget/margin/best-value-supplier analysis
(`POST`/`GET /production/proposals/:proposalId/budget-analysis`) are also
implemented, with all cost math computed deterministically from real
Knowledge Graph cost data rather than invented by the model. Modo
Produção (the project hub changing shape once a proposal is approved, to
foreground checklist/schedule/suppliers/ceremony time) is implemented
too. Post-event feedback now automatically feeds back into the Knowledge
Graph too: `supplierPerformance` ratings promote/demote a supplier's
preferred status at that event's venue and accumulate into its
performance notes, deterministically — see `docs/05-database-bible.md`.
Still missing: adjusting style-compatibility scores from the feedback's
free-text fields (would require an AI interpreting free text, risking a
fabricated signal — no numeric material×style score field exists in the
schema today anyway), and assembly/disassembly labor cost estimation for
Agente 4 (no real labor-cost data exists yet to estimate this without
inventing numbers). Per-field manual editing of a proposal component is
implemented too: `PATCH /creative/proposals/:proposalId/components/:componentType`
shallow-merges the given fields, with an "Editar" button per component in
the Editor. The proposal document's real PDF/presentation artifact is
implemented too: `GET /creative/proposals/:proposalId/document/pdf`
(`pdfkit`), with a "Baixar PDF" button in `apps/web`. A read-only Canvas
do Evento is implemented too: `GET /projects/:eventId/canvas`
(`/projects/:eventId/canvas` in `apps/web`, a radial node graph) —
deliberately without the Rule Engine/Event Impact Engine's cascading
recalculation, which needs real business rules that don't exist anywhere
in the system yet. `apps/admin` now has real screens too: manual
create/edit for the Knowledge Graph's 4 catalog entities (styles,
materials, venues, suppliers) — until now only readable, with no way to
register or edit one without touching the database directly. `apps/mobile`
now has real screens too: a Modo Produção field app reusing the existing
production plan endpoint (materials list, assembly schedule, checklist),
with no persisted session and no external navigation library for its 3
screens. This completes the Sprint 5+ sequenced plan
(items 1-9) from `docs/08-roadmap.md`. Independent of that sequence,
still open: production deploy infrastructure and assembly/disassembly
labor cost estimation (no real labor-cost data exists yet).
