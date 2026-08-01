FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY . .
# Only needed to satisfy the root postinstall hook's `prisma generate`
# (which requires DATABASE_URL to be resolvable, though it never connects
# to it) — the real DATABASE_URL is supplied at runtime via docker-compose.
ARG DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
ENV DATABASE_URL=$DATABASE_URL
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @eve-os/api... build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo/apps/api/dist ./apps/api/dist
COPY --from=build /repo/apps/api/package.json ./apps/api/package.json
COPY --from=build /repo/apps/api/prisma ./apps/api/prisma
COPY --from=build /repo/apps/api/prisma.config.ts ./apps/api/prisma.config.ts
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/api/node_modules ./apps/api/node_modules
EXPOSE 4000
# Applies pending migrations before serving, always — a fresh Postgres
# volume (or a first cloud deploy) would otherwise fail on missing tables.
# Seeding the Knowledge Graph sample data is opt-in via SEED_ON_BOOT
# (docker-compose.yml's local dev profile turns it on): auto-seeding by
# default would silently write fake demo data (Villa Massari, etc.) into
# a real production database on every restart, which is exactly the kind
# of fabricated data this project's Knowledge Graph is built to avoid.
CMD ["sh", "-c", "cd apps/api && npx prisma migrate deploy && ( [ \"$SEED_ON_BOOT\" = \"true\" ] && npx prisma db seed || true ) && cd /repo && node apps/api/dist/main.js"]
