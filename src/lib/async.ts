/** Executa trabalho assíncrono em lotes limitados, mantendo a ordem dos resultados. */
export async function mapWithConcurrency<T, TResult>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<TResult>,
): Promise<TResult[]> {
  if (items.length === 0) return [];

  const limit = Math.max(1, Math.min(Math.floor(concurrency), items.length));
  const results = Array<TResult>(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;
      results[index] = await worker(items[index]!, index);
    }
  }

  await Promise.all(Array.from({ length: limit }, () => runWorker()));
  return results;
}
