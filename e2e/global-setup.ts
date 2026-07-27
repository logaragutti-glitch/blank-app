import { execSync } from "node:child_process";

/**
 * Prepara o banco usado pelos testes E2E: cria o banco se não existir, aplica
 * as migrations e as policies de RLS. Não reseta dados entre execuções — os
 * testes geram e-mails/nomes únicos (`uniqueEmail`) para nunca colidir com
 * dados de uma execução anterior, então recriar o banco do zero a cada run
 * não é necessário.
 */
export default async function globalSetup() {
  const testDbUrl =
    process.env.E2E_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/mem_architect_e2e";
  const dbName = new URL(testDbUrl).pathname.replace("/", "");
  const adminUrl = testDbUrl.replace(`/${dbName}`, "/postgres");

  execSync(
    `psql "${adminUrl}" -tc "SELECT 1 FROM pg_database WHERE datname = '${dbName}'" | grep -q 1 || psql "${adminUrl}" -c "CREATE DATABASE ${dbName}"`,
    { stdio: "inherit", shell: "/bin/bash" },
  );

  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: testDbUrl, DIRECT_URL: testDbUrl },
  });

  execSync(`psql "${testDbUrl}" -f prisma/rls.sql`, { stdio: "pipe" });

  process.env.E2E_DATABASE_URL = testDbUrl;
}
