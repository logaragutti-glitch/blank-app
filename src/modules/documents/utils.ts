/**
 * Utilidades puras do módulo de documentos — deliberadamente sem imports de
 * `@/lib/*` ou de outros módulos com efeitos colaterais (Prisma, Auth.js). Isso é
 * o que permite testar essas funções isoladamente (ver `utils.test.ts`) sem
 * arrastar toda a cadeia de dependências do servidor.
 */

/** `getEvent` traz todas as versões (histórico); a UI só precisa da mais recente por tipo. */
export function pickLatestPerType<T extends { type: string; version: number }>(documents: T[]): T[] {
  const latestByType = new Map<string, T>();
  for (const doc of documents) {
    const current = latestByType.get(doc.type);
    if (!current || doc.version > current.version) {
      latestByType.set(doc.type, doc);
    }
  }
  return Array.from(latestByType.values());
}
