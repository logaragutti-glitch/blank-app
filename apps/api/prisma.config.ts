import { defineConfig, env } from "prisma/config";

try {
  process.loadEnvFile(new URL(".env", import.meta.url));
} catch {
  // .env is optional (e.g. when DATABASE_URL is provided by the shell/CI)
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
