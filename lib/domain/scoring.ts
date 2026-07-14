import {
  AreaScore,
  DiagnosticResult,
  LEVEL_NAME,
  MasterRow,
  RecommendationRow,
  ScoreValue,
  ScoredSubpoint,
  SubpointScore,
} from "./types";

/**
 * Ported 1:1 from app.py's compute_diagnostic(). `moduleRows` must already be filtered to
 * a single module_id (mirrors passing `module_df` in the Python version). `scores` only
 * needs to contain entries for subpoints actually scored; anything not in the map is
 * treated as un-scored and excluded from every average, exactly like the Python
 * `df["score"].between(1, 5)` filter.
 */
export function computeDiagnostic(
  moduleRows: MasterRow[],
  scores: Map<string, ScoreValue>,
  observations: Map<string, string>,
  recommendations: RecommendationRow[],
  photos: Map<string, string> = new Map()
): DiagnosticResult {
  const hasModuleId = recommendations.some((r) => "module_id" in r);
  const recoMap = new Map<string, string>();
  for (const r of recommendations) {
    const key = recoKey(hasModuleId ? r.module_id : null, r.subpoint_id, r.target_level);
    recoMap.set(key, r.recommended_tasks);
  }

  const scored: ScoredSubpoint[] = [];
  for (const row of moduleRows) {
    const score = scores.get(row.subpoint_id);
    if (score === undefined) continue; // un-scored - excluded, same as the Python between(1,5) filter

    const target = (score < 5 ? Math.min(score + 1, 5) : 5) as ScoreValue;
    const weightedGap = (5 - score) * row.subpoint_weight * row.area_weight;
    const tasks =
      score >= 5 ? "" : recoMap.get(recoKey(hasModuleId ? row.module_id : null, row.subpoint_id, target)) ?? "";

    scored.push({
      ...row,
      score,
      observation: observations.get(row.subpoint_id) ?? "",
      photo: photos.get(row.subpoint_id),
      level_name: LEVEL_NAME[score],
      target,
      target_name: LEVEL_NAME[target],
      weighted_gap: weightedGap,
      tasks,
    });
  }

  // Area-level weighted maturity, over scored subpoints in that area only.
  const byArea = new Map<string, ScoredSubpoint[]>();
  for (const s of scored) {
    const list = byArea.get(s.area_id) ?? [];
    list.push(s);
    byArea.set(s.area_id, list);
  }
  const areaScores: AreaScore[] = [...byArea.entries()]
    .map(([areaId, rows]) => {
      const w = sum(rows.map((r) => r.subpoint_weight));
      const areaScore = w ? sum(rows.map((r) => r.score * r.subpoint_weight)) / w : mean(rows.map((r) => r.score));
      return {
        area_id: areaId,
        area_name: rows[0].area_name,
        area_weight: rows[0].area_weight,
        area_score: areaScore,
        n_scored: rows.length,
      };
    })
    .sort((a, b) => a.area_id.localeCompare(b.area_id));

  let moduleScore = 0;
  if (areaScores.length) {
    const aw = sum(areaScores.map((a) => a.area_weight));
    moduleScore = aw
      ? sum(areaScores.map((a) => a.area_score * a.area_weight)) / aw
      : mean(areaScores.map((a) => a.area_score));
  }

  return {
    scored,
    area_scores: areaScores,
    module_score: moduleScore,
    pct: (moduleScore / 5) * 100,
    n_scored: scored.length,
    n_total: moduleRows.length,
  };
}

function recoKey(moduleId: string | null, subpointId: string, targetLevel: number): string {
  return `${moduleId ?? ""}::${subpointId}::${targetLevel}`;
}

function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0);
}

function mean(xs: number[]): number {
  return xs.length ? sum(xs) / xs.length : 0;
}

/** Parses a completed checklist upload's raw {subpoint_id, score, observation} rows into
 * the Map inputs computeDiagnostic() expects. Only scores 1-5 are kept - mirrors app.py's
 * parse_uploaded_checklist() + the `between(1, 5)` filter applied at diagnostic time. */
export function toScoreMaps(rows: SubpointScore[]): {
  scores: Map<string, ScoreValue>;
  observations: Map<string, string>;
} {
  const scores = new Map<string, ScoreValue>();
  const observations = new Map<string, string>();
  for (const r of rows) {
    if (r.score >= 1 && r.score <= 5) scores.set(r.subpoint_id, r.score);
    if (r.observation) observations.set(r.subpoint_id, r.observation);
  }
  return { scores, observations };
}
