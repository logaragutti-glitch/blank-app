import { describe, expect, it } from "vitest";
import { mapWithConcurrency } from "@/lib/async";

describe("mapWithConcurrency", () => {
  it("limita o número de workers ativos e preserva a ordem de entrada", async () => {
    let active = 0;
    let maximumActive = 0;

    const result = await mapWithConcurrency([1, 2, 3, 4, 5], 2, async (value) => {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      await new Promise((resolve) => setTimeout(resolve, value === 1 ? 15 : 0));
      active -= 1;
      return value * 2;
    });

    expect(maximumActive).toBe(2);
    expect(result).toEqual([2, 4, 6, 8, 10]);
  });

  it("usa um worker quando a concorrência configurada é inválida", async () => {
    let active = 0;
    let maximumActive = 0;

    const result = await mapWithConcurrency(["a", "b", "c"], 0, async (value) => {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      await Promise.resolve();
      active -= 1;
      return value.toUpperCase();
    });

    expect(maximumActive).toBe(1);
    expect(result).toEqual(["A", "B", "C"]);
  });

  it("retorna lista vazia sem iniciar workers", async () => {
    const result = await mapWithConcurrency([], 3, async (value: never) => value);
    expect(result).toEqual([]);
  });
});
