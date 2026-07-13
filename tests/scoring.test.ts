import { describe, it, expect } from "vitest";
import { computeDiagnostic } from "@/lib/domain/scoring";
import type { MasterRow, RecommendationRow, ScoreValue } from "@/lib/domain/types";
import mastersJson from "@/lib/data/local-fallback/masters.json";
import recommendationsJson from "@/lib/data/local-fallback/recommendations.json";

// Parity check against scripts/golden_diagnostic.py, which runs app.py's exact
// compute_diagnostic() Python logic on the same real sample data with this same
// synthetic score set (deterministic 1-5 cycle over the first 20 subpoints of WH_V1,
// sorted by subpoint_id). See scripts/golden_output.json for the reference values below.
describe("computeDiagnostic parity with the Python implementation", () => {
  const masters = mastersJson as unknown as MasterRow[];
  const recommendations = recommendationsJson as unknown as RecommendationRow[];
  const moduleRows = masters.filter((r) => r.module_id === "WH_V1");

  const subpointIds = [...moduleRows.map((r) => r.subpoint_id)].sort().slice(0, 20);
  const scores = new Map<string, ScoreValue>(
    subpointIds.map((sid, i) => [sid, (((i % 5) + 1) as ScoreValue)])
  );
  const observations = new Map<string, string>([[subpointIds[0], "Sample observation for golden test"]]);

  const result = computeDiagnostic(moduleRows, scores, observations, recommendations);

  it("matches the Python golden output's module-level numbers", () => {
    expect(result.module_score).toBeCloseTo(3.2487000000000004, 9);
    expect(result.pct).toBeCloseTo(64.974, 9);
    expect(result.n_scored).toBe(20);
    expect(result.n_total).toBe(23);
  });

  it("matches the Python golden output's per-area scores", () => {
    const expected = [
      { area_id: "A1", area_name: "Inward", area_weight: 0.17, area_score: 3.0, n_scored: 5 },
      { area_id: "A2", area_name: "Quality Control", area_weight: 0.17, area_score: 2.5, n_scored: 4 },
      { area_id: "A3", area_name: "Putaway", area_weight: 0.17, area_score: 2.75, n_scored: 4 },
      { area_id: "A4", area_name: "Packaging", area_weight: 0.17, area_score: 3.3400000000000003, n_scored: 3 },
      { area_id: "A5", area_name: "Staging", area_weight: 0.16, area_score: 2.99, n_scored: 3 },
      { area_id: "A6", area_name: "Dispatch", area_weight: 0.16, area_score: 5.0, n_scored: 1 },
    ];
    expect(result.area_scores).toHaveLength(expected.length);
    expected.forEach((exp, i) => {
      const got = result.area_scores[i];
      expect(got.area_id).toBe(exp.area_id);
      expect(got.area_name).toBe(exp.area_name);
      expect(got.area_weight).toBeCloseTo(exp.area_weight, 9);
      expect(got.area_score).toBeCloseTo(exp.area_score, 9);
      expect(got.n_scored).toBe(exp.n_scored);
    });
  });

  it("computes weighted_gap, target, and level_name correctly for a sample scored row", () => {
    const a11 = result.scored.find((s) => s.subpoint_id === "A1.1");
    expect(a11).toBeDefined();
    expect(a11!.score).toBe(1);
    expect(a11!.level_name).toBe("Ad-hoc");
    expect(a11!.target).toBe(2);
    expect(a11!.target_name).toBe("Basic");
    expect(a11!.weighted_gap).toBeCloseTo((5 - 1) * a11!.subpoint_weight * a11!.area_weight, 9);
    expect(a11!.observation).toBe("Sample observation for golden test");
  });

  it("assigns no recommended tasks to a subpoint scored 5", () => {
    const a31 = result.scored.find((s) => s.subpoint_id === "A3.1");
    expect(a31?.score).toBe(5);
    expect(a31?.tasks).toBe("");
  });

  it("excludes un-scored subpoints from the result entirely", () => {
    const scoredIds = new Set(result.scored.map((s) => s.subpoint_id));
    const unscored = moduleRows.map((r) => r.subpoint_id).filter((id) => !subpointIds.includes(id));
    expect(unscored.length).toBeGreaterThan(0);
    for (const id of unscored) expect(scoredIds.has(id)).toBe(false);
  });
});
