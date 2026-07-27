import { defineConfig } from "@playwright/test";

const PORT = 3100;
const TEST_DATABASE_URL =
  process.env.E2E_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/mem_architect_e2e";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  // Banco compartilhado entre os testes (dados isolados por e-mail/nome únicos,
  // ver e2e/helpers.ts) — rodar em série evita ruído difícil de depurar entre
  // specs sem ganhar muito em velocidade neste conjunto pequeno de testes.
  workers: 1,
  reporter: "list",
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    // Este ambiente pré-instala apenas o Chromium completo (não o
    // chromium_headless_shell que versões mais novas do @playwright/test
    // preferem por padrão) — força o executável existente em vez de tentar
    // baixar um novo.
    launchOptions: {
      executablePath: "/opt/pw-browsers/chromium",
    },
  },
  webServer: {
    command: `npm run dev -- -p ${PORT}`,
    url: `http://localhost:${PORT}/sign-in`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      DIRECT_URL: TEST_DATABASE_URL,
      AUTH_SECRET: "e2e-test-secret-not-for-production",
    },
  },
});
