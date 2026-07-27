import { describe, expect, it } from "vitest";

import { pickLatestPerType } from "./utils";

describe("pickLatestPerType", () => {
  it("mantém só a versão mais recente de cada tipo", () => {
    const docs = [
      { type: "DNA_EVENTO", version: 1 },
      { type: "DNA_EVENTO", version: 2 },
      { type: "CHECKLIST", version: 1 },
    ];
    const result = pickLatestPerType(docs);
    expect(result).toHaveLength(2);
    expect(result.find((d) => d.type === "DNA_EVENTO")?.version).toBe(2);
  });

  it("lista vazia retorna lista vazia", () => {
    expect(pickLatestPerType([])).toEqual([]);
  });

  it("ordem de entrada não importa — a maior versão sempre vence", () => {
    const docs = [
      { type: "CHECKLIST", version: 3 },
      { type: "CHECKLIST", version: 1 },
      { type: "CHECKLIST", version: 2 },
    ];
    expect(pickLatestPerType(docs)).toEqual([{ type: "CHECKLIST", version: 3 }]);
  });
});
