import { expect, test } from "@playwright/test";

import { answerQuestion, createEvent, signUp, uniqueEmail } from "./helpers";

test("geração de documentos falha graciosamente sem OPENAI_API_KEY, edição manual funciona e recalcula o MEM Score", async ({
  page,
}) => {
  test.skip(!!process.env.OPENAI_API_KEY, "Este teste assume ausência de OPENAI_API_KEY (fallback).");

  const email = uniqueEmail("docs");
  await signUp(page, { name: "Maria Owner", organizationName: "MEM E2E Documentos", email });
  await createEvent(page, "Congresso TechCorp");

  await page.click("text=Iniciar entrevista");
  await page.waitForURL(/\/interview$/, { timeout: 10_000 });
  await page.click('button:has-text("Corporativo")');
  await expect(page.getByText("objetivo principal")).toBeVisible();
  await answerQuestion(page, "Fortalecer a marca empregadora", "resultado de negócio");
  await answerQuestion(page, "Gerar 10 leads qualificados", "formato do evento");
  await page.click('button:has-text("Palestra")');
  await expect(page.getByText("Quantos convidados")).toBeVisible();
  await answerQuestion(page, "150", "data do evento");
  await answerQuestion(page, "2026-11-20", "Onde será");
  await answerQuestion(page, "Centro de Convenções, SP", "orçamento estimado");
  await answerQuestion(page, "120000", "Quem é o público");
  await answerQuestion(page, "Clientes VIP", "restrição importante");
  await page.click("text=Pular esta pergunta");
  await expect(page.getByText("fornecedor contratado")).toBeVisible();
  await page.click("text=Pular esta pergunta");
  await expect(page.getByText("Revisão da entrevista")).toBeVisible();
  await page.click('button:has-text("Gerar projeto")');
  await page.waitForURL(/\/events\/[a-z0-9]+$/, { timeout: 10_000 });

  await page.click('button:has-text("Gerar documentos")');
  await expect(page.getByText("Documentos MEM")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("0 de 9 prontos")).toBeVisible();
  await expect(page.getByText("Revisão")).toBeVisible();

  const scoreBefore = await page.locator("text=/MEM Score:/").textContent();

  // Preenche o DNA manualmente a partir do documento que falhou
  await page.click('button[role="tab"]:has-text("DNA")');
  await expect(page.getByText("Falhou")).toBeVisible();
  await page.click('button:has-text("Editar")');
  await page.waitForSelector('textarea[name="content"]');
  const filled = JSON.stringify(
    {
      essence: "Um congresso que conecta tecnologia e relacionamento genuíno",
      guidingEmotions: ["confiança", "inspiração"],
      keywords: ["inovação", "networking"],
      narrative: "O evento reúne clientes VIP em um ambiente que mistura conteúdo técnico com conexão real.",
    },
    null,
    2,
  );
  await page.fill('textarea[name="content"]', filled);
  await page.click('button:has-text("Salvar como nova versão")');
  await expect(page.getByText("confiança")).toBeVisible();

  // MEM Score deve ter subido (completude passou de 0/9 para 1/9)
  const scoreAfter = await page.locator("text=/MEM Score:/").textContent();
  const parseScore = (text: string | null) => Number(text?.match(/\d+/)?.[0] ?? "0");
  expect(parseScore(scoreAfter)).toBeGreaterThan(parseScore(scoreBefore));

  // Checklist: preenche manualmente e confirma que sincroniza com a lista real
  await page.click('button[role="tab"]:has-text("Checklist")');
  await page.click('button:has-text("Editar")');
  await page.waitForSelector('textarea[name="content"]');
  const checklist = JSON.stringify(
    {
      // checklistSchema exige no mínimo 3 itens — ver src/modules/documents/schemas.ts
      items: [
        { title: "Confirmar palco e audiovisual", dueOffsetDays: 30 },
        { title: "Fechar lista de convidados VIP", dueOffsetDays: 20 },
        { title: "Testar credenciamento", dueOffsetDays: 5 },
      ],
    },
    null,
    2,
  );
  await page.fill('textarea[name="content"]', checklist);
  await page.click('button:has-text("Salvar como nova versão")');
  await expect(page.getByText("Confirmar palco e audiovisual")).toBeVisible();
});
