import { describe, expect, it } from "vitest";
import { isPast, nowUtc } from "./dates";

describe("dates", () => {
  it("nowUtc returns a valid ISO string", () => {
    expect(() => new Date(nowUtc())).not.toThrow();
  });

  it("isPast detects a past date", () => {
    expect(isPast("2000-01-01T00:00:00.000Z")).toBe(true);
  });

  it("isPast detects a future date", () => {
    expect(isPast("2999-01-01T00:00:00.000Z")).toBe(false);
  });
});
