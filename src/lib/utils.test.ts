import { describe, expect, it } from "vitest";

import { cn, slugify } from "./utils";

describe("slugify", () => {
  it("normaliza acentos e espaços", () => {
    expect(slugify("MEM Demo Produtora Ação")).toBe("mem-demo-produtora-acao");
  });

  it("remove caracteres especiais", () => {
    expect(slugify("Foo & Bar!! 123")).toBe("foo-bar-123");
  });

  it("não deixa hífen no início ou fim", () => {
    expect(slugify("  Olá Mundo  ")).toBe("ola-mundo");
  });

  it("string vazia vira string vazia", () => {
    expect(slugify("")).toBe("");
  });
});

describe("cn", () => {
  it("junta classes e resolve conflitos do Tailwind (última vence)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("ignora valores falsy", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });
});
