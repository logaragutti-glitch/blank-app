import { computeWowScore } from "./wow-score";

describe("computeWowScore", () => {
  it("returns null when there are no dnaScores", () => {
    expect(computeWowScore(null, { Romance: 90 })).toBeNull();
    expect(computeWowScore({}, { Romance: 90 })).toBeNull();
  });

  it("scores higher for a distinctive profile that matches the chosen style", () => {
    const dnaScores = { Romance: 94, Elegancia: 91, Modernidade: 10 };
    const matchedStyleDimensionScores = { Romance: 92, Elegancia: 88, Modernidade: 15 };

    const score = computeWowScore(dnaScores, matchedStyleDimensionScores);
    expect(score).not.toBeNull();
    expect(score as number).toBeGreaterThan(70);
    expect(score as number).toBeLessThanOrEqual(100);
  });

  it("scores lower for a flat profile with no dominant emotion", () => {
    const dnaScores = { Romance: 50, Elegancia: 50, Modernidade: 50 };
    const score = computeWowScore(dnaScores, dnaScores);
    expect(score).not.toBeNull();
    // A flat profile has zero originality (stdDev = 0), so the score should
    // rest entirely on the (perfect, here) coherence component.
    expect(score).toBe(60);
  });

  it("falls back to a neutral coherence baseline when there is no matched style", () => {
    const dnaScores = { Romance: 90, Elegancia: 85 };
    const score = computeWowScore(dnaScores, null);
    expect(score).not.toBeNull();
    expect(score as number).toBeGreaterThan(0);
  });

  it("clamps the result to [0, 100]", () => {
    const dnaScores = { Romance: 100, Modernidade: 0 };
    const matchedStyleDimensionScores = { Romance: 0, Modernidade: 100 };
    const score = computeWowScore(dnaScores, matchedStyleDimensionScores);
    expect(score).not.toBeNull();
    expect(score as number).toBeGreaterThanOrEqual(0);
    expect(score as number).toBeLessThanOrEqual(100);
  });
});
