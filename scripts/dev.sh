#!/usr/bin/env bash
# Single-command local bootstrap: infra containers + all app dev servers.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

echo "Starting infra (postgres, redis, rabbitmq, opensearch)..."
docker compose up -d postgres redis rabbitmq opensearch

echo "Waiting for infra health checks..."
until [ "$(docker compose ps --format '{{.Health}}' postgres redis rabbitmq opensearch | grep -vc healthy)" -eq 0 ]; do
  sleep 2
done
echo "Infra is healthy."

if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  pnpm install
fi

echo "Starting apps (web:3000, admin:3001, api:4000)..."
exec pnpm turbo run dev
