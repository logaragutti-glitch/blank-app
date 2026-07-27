import type { Page } from "@playwright/test";
import { randomUUID } from "node:crypto";

export function uniqueEmail(prefix: string) {
  return `${prefix}.${randomUUID().slice(0, 8)}@e2e.test`;
}

export async function signUp(
  page: Page,
  { name, organizationName, email, password = "senha1234" }: { name: string; organizationName: string; email: string; password?: string },
) {
  await page.goto("/sign-up", { waitUntil: "networkidle" });
  await page.fill("#name", name);
  await page.fill("#organizationName", organizationName);
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type=submit]');
  await page.waitForURL("**/dashboard", { timeout: 15_000 });
}

export async function signIn(page: Page, email: string, password = "senha1234") {
  await page.goto("/sign-in", { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type=submit]');
  await page.waitForURL("**/dashboard", { timeout: 15_000 });
}

export async function createEvent(page: Page, name: string) {
  await page.goto("/events", { waitUntil: "networkidle" });
  await page.click("text=Novo evento");
  await page.fill("#name", name);
  await page.click('button:has-text("Criar evento")');
  await page.waitForSelector(`text=${name}`, { timeout: 10_000 });
  await page.click(`text=${name}`);
  await page.waitForURL(/\/events\/[a-z0-9]+$/, { timeout: 10_000 });
}

/**
 * Responde a pergunta atual da entrevista e espera o texto da PRÓXIMA pergunta
 * aparecer antes de devolver o controle — sem isso, o próximo `fill` pode
 * atingir o input antigo antes do React trocar de pergunta (o tipo do campo
 * muda entre perguntas: number, date, text), causando falhas intermitentes.
 */
export async function answerQuestion(
  page: Page,
  value: string,
  nextText: string,
  submitLabel = "Continuar",
) {
  await page.fill('input[name="rawValue"]', value);
  await page.getByRole("button", { name: submitLabel, exact: true }).click();
  await page.getByText(nextText).first().waitFor({ timeout: 10_000 });
}
