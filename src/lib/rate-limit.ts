import { db } from "@/lib/db";

export class RateLimitError extends Error {}

interface RateLimitRule {
  windowMinutes: number;
  maxHits: number;
}

export type AiRoute = "documents.generate" | "documents.regenerate" | "interview.clarify";

/**
 * Limites por rota de IA (docs/ARCHITECTURE.md §6, docs/SECURITY.md). Contados
 * por organização, não por usuário — o custo de IA é da organização.
 * `documents.generate` é o mais caro (dispara os 9 documentos em paralelo por
 * chamada), por isso o limite mais baixo. `Record<AiRoute, ...>` (união
 * literal fechada, não `Record<string, ...>`) é o que garante em tempo de
 * compilação que toda rota tem uma regra — sem isso `RULES[route]` seria
 * `RateLimitRule | undefined` mesmo sabendo que a chave sempre existe.
 */
const RULES: Record<AiRoute, RateLimitRule> = {
  "documents.generate": { windowMinutes: 10, maxHits: 10 },
  "documents.regenerate": { windowMinutes: 10, maxHits: 30 },
  "interview.clarify": { windowMinutes: 10, maxHits: 30 },
};

/**
 * Registra a tentativa e barra se o limite da janela foi atingido. Chamado
 * ANTES de qualquer chamada real ao provedor de IA — conta tentativas, não só
 * sucessos, porque o abuso a ser prevenido é de chamadas (custo), não de
 * respostas bem-sucedidas.
 */
export async function enforceAiRateLimit(organizationId: string, route: AiRoute) {
  const rule = RULES[route];
  const windowStart = new Date(Date.now() - rule.windowMinutes * 60_000);

  const hits = await db.aiRateLimitHit.count({
    where: { organizationId, route, createdAt: { gte: windowStart } },
  });

  if (hits >= rule.maxHits) {
    throw new RateLimitError(
      `Limite de ${rule.maxHits} chamadas de IA a cada ${rule.windowMinutes} minutos atingido para esta organização. Tente novamente em alguns minutos.`,
    );
  }

  await db.aiRateLimitHit.create({ data: { organizationId, route } });
}
