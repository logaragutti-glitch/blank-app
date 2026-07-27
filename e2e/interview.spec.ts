import { expect, test } from "@playwright/test";

import { answerQuestion, createEvent, signUp, uniqueEmail } from "./helpers";

test("editar o tipo do evento invalida só o ramo antigo, preserva as respostas comuns (regressão)", async ({
  page,
}) => {
  const email = uniqueEmail("interview");
  await signUp(page, { name: "Maria Owner", organizationName: "MEM E2E Entrevista", email });
  await createEvent(page, "Casamento Ana & Rui");

  await page.click("text=Iniciar entrevista");
  await page.waitForURL(/\/interview$/, { timeout: 10_000 });

  // Ramo casamento
  await page.click('button:has-text("Casamento")');
  await expect(page.getByText("objetivo principal")).toBeVisible();
  await answerQuestion(page, "Celebrar a união com a família", "cerimônia será religiosa");
  await page.click('button:has-text("Civil")');
  await expect(page.getByText("tradição")).toBeVisible();
  await page.click("text=Pular esta pergunta");

  // Perguntas comuns
  await expect(page.getByText("Quantos convidados")).toBeVisible();
  await answerQuestion(page, "80", "data do evento");
  await answerQuestion(page, "2026-12-05", "Onde será");
  await answerQuestion(page, "Sítio Boa Vista, SP", "orçamento estimado");
  await answerQuestion(page, "45000", "Quem é o público");
  await answerQuestion(page, "Família e amigos próximos", "restrição importante");
  await page.click("text=Pular esta pergunta"); // restrições
  await expect(page.getByText("fornecedor contratado")).toBeVisible();
  await page.click("text=Pular esta pergunta"); // fornecedores

  await expect(page.getByText("Revisão da entrevista")).toBeVisible();
  await expect(page.getByText("80")).toBeVisible();
  await expect(page.getByText("Sítio Boa Vista, SP")).toBeVisible();

  // Edita o tipo do evento — só o ramo antigo (cerimônia/tradição) deve sumir
  await page.locator('a:has-text("Editar")').first().click();
  await expect(page.getByText("Qual é o tipo do evento")).toBeVisible();
  await page.click('button:has-text("Corporativo")');

  // Deveria pular direto para a pergunta do NOVO ramo (business_goal), não
  // ficar preso na mesma pergunta nem repetir as perguntas comuns já respondidas
  await expect(page.getByText("resultado de negócio")).toBeVisible();
  await answerQuestion(page, "Fechar 5 novas parcerias estratégicas", "formato do evento");
  await page.click('button:has-text("Palestra")');

  // Direto para a revisão — as respostas comuns sobreviveram à edição
  await expect(page.getByText("Revisão da entrevista")).toBeVisible();
  await expect(page.getByText("corporativo")).toBeVisible();
  await expect(page.getByText("80")).toBeVisible();
  await expect(page.getByText("Sítio Boa Vista, SP")).toBeVisible();
  await expect(page.getByText("45000")).toBeVisible();

  await page.click('button:has-text("Gerar projeto")');
  await page.waitForURL(/\/events\/[a-z0-9]+$/, { timeout: 10_000 });
  await expect(page.getByText("Gerando")).toBeVisible();

  // A entrevista sincroniza os campos estruturados do evento
  await expect(page.getByText("corporativo").first()).toBeVisible();
  await expect(page.getByText("Sítio Boa Vista, SP").first()).toBeVisible();
});
