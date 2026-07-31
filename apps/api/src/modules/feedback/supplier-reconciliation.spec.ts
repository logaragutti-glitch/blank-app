import { buildPerformanceNote, decideSupplierPreference, isUuid } from "./supplier-reconciliation";

describe("isUuid", () => {
  it("accepts a well-formed UUID", () => {
    expect(isUuid("00000000-0000-0000-0000-000000000002")).toBe(true);
  });

  it("rejects a non-UUID string, never letting it reach a @db.Uuid query", () => {
    expect(isUuid("supplier-1")).toBe(false);
    expect(isUuid("")).toBe(false);
    expect(isUuid("00000000-0000-0000-0000-00000000000")).toBe(false);
  });
});

describe("decideSupplierPreference", () => {
  it("promotes a supplier rated 4 or 5", () => {
    expect(decideSupplierPreference(4)).toBe("promote");
    expect(decideSupplierPreference(5)).toBe("promote");
  });

  it("demotes a supplier rated 1 or 2", () => {
    expect(decideSupplierPreference(1)).toBe("demote");
    expect(decideSupplierPreference(2)).toBe("demote");
  });

  it("leaves a neutral rating of 3 unchanged", () => {
    expect(decideSupplierPreference(3)).toBe("no-change");
  });
});

describe("buildPerformanceNote", () => {
  it("includes the date, event id, and rating", () => {
    const note = buildPerformanceNote("event-1", 5, undefined, new Date("2026-07-31T12:00:00Z"));
    expect(note).toBe("[2026-07-31] Feedback do evento event-1: nota 5/5");
  });

  it("appends the caller's own notes verbatim, never inventing commentary", () => {
    const note = buildPerformanceNote(
      "event-1",
      2,
      "Atraso na entrega das flores.",
      new Date("2026-07-31T12:00:00Z"),
    );
    expect(note).toBe("[2026-07-31] Feedback do evento event-1: nota 2/5 — Atraso na entrega das flores.");
  });
});
