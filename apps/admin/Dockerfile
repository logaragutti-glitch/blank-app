FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @eve-os/admin... build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo/apps/admin/.next ./apps/admin/.next
COPY --from=build /repo/apps/admin/public ./apps/admin/public
COPY --from=build /repo/apps/admin/package.json ./apps/admin/package.json
COPY --from=build /repo/apps/admin/next.config.mjs ./apps/admin/next.config.mjs
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/admin/node_modules ./apps/admin/node_modules
WORKDIR /repo/apps/admin
EXPOSE 3001
CMD ["node_modules/.bin/next", "start", "-p", "3001"]
