import { expect, test } from "@playwright/test";

import { signUp, uniqueEmail } from "./helpers";

test("cadastro cria organização, e criar cliente/evento aparece no dashboard com dados reais", async ({
  page,
}) => {
  const email = uniqueEmail("owner");
  await signUp(page, { name: "Maria Owner", organizationName: "MEM E2E Produtora", email });

  await page.goto("/clients", { waitUntil: "networkidle" });
  await page.click("text=Novo cliente");
  await page.fill("#name", "Ana & Rui");
  await page.fill("#email", "ana.rui@cliente.com");
  await page.click('button:has-text("Criar cliente")');
  await expect(page.getByText("Ana & Rui")).toBeVisible();

  await page.goto("/events", { waitUntil: "networkidle" });
  await page.click("text=Novo evento");
  await page.fill("#name", "Casamento Ana & Rui");
  await page.selectOption("#clientId", { label: "Ana & Rui" });
  await page.click('button:has-text("Criar evento")');
  await expect(page.getByText("Casamento Ana & Rui")).toBeVisible();

  await page.goto("/dashboard", { waitUntil: "networkidle" });
  // "Eventos ativos" (h3, CardTitle) e o número (span, CardContent) são irmãos
  // dentro do mesmo Card — sobe dois níveis (CardHeader -> Card) para achar os dois.
  const activeEventsCard = page.getByText("Eventos ativos").locator("../..");
  await expect(activeEventsCard.locator("span")).toHaveText("1");
  await expect(page.getByRole("link", { name: /Casamento Ana & Rui/ })).toBeVisible();
});

test("convite de membro: e-mail novo fica pendente e é aceito automaticamente no cadastro", async ({
  page,
}) => {
  const ownerEmail = uniqueEmail("owner2");
  const invitedEmail = uniqueEmail("invited");

  await signUp(page, { name: "Maria Owner", organizationName: "MEM E2E Convites", email: ownerEmail });

  await page.goto("/settings", { waitUntil: "networkidle" });
  await page.click("text=Convidar membro");
  await page.fill("#email", invitedEmail);
  await page.getByRole("button", { name: "Convidar", exact: true }).click();
  await expect(page.getByText(invitedEmail)).toBeVisible();
  await expect(page.getByText("Aguardando cadastro")).toBeVisible();

  await page.context().clearCookies();
  await signUp(page, {
    name: "João Convidado",
    organizationName: "Isso não deveria ser usado",
    email: invitedEmail,
  });

  await page.goto("/settings", { waitUntil: "networkidle" });
  await expect(page.getByText("MEM E2E Convites").first()).toBeVisible();
  await expect(page.getByText("João Convidado")).toBeVisible();
});
