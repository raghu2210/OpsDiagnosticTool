import {
  AreaScore,
  DiagnosticResult,
  LEVEL_NAME,
  MasterRow,
  ProblemRow,
  RecommendationRow,
  ScoreValue,
  ScoredProblem,
  ScoredSubpoint,
  SubpointScore,
} from "./types";
import { compareAreaIds } from "./grouping";

/**
 * Ported 1:1 from app.py's compute_diagnostic(). `moduleRows` must already be filtered to
 * a single module_id (mirrors passing `module_df` in the Python version). `scores` only
 * needs to contain entries for subpoints actually scored; anything not in the map is
 * treated as un-scored and excluded from every average, exactly like the Python
 * `df["score"].between(1, 5)` filter.
 *
 * `problems`/`problemScores` add Node 4 (leaf-level problem-statement scoring) on top,
 * additive and backward-compatible: a sub-point with rows in `problems` gets its score
 * computed as the weighted rollup of its problem statements' scores (Node 4 -> Node 3),
 * using the exact same weighted-average pattern already used one level up for
 * sub-point -> area -> module. A sub-point with no `problems` rows (or with rows but none
 * scored) falls back to the direct `scores` map lookup, unchanged from before - this is
 * what keeps the .xlsx upload path working untouched for sub-points that have been
 * broken down to Node 4: an uploaded checklist only ever provides direct scores.
 */
export function computeDiagnostic(
  moduleRows: MasterRow[],
  scores: Map<string, ScoreValue>,
  observations: Map<string, string>,
  recommendations: RecommendationRow[],
  photos: Map<string, string> = new Map(),
  problems: ProblemRow[] = [],
  problemScores: Map<string, ScoreValue> = new Map()
): DiagnosticResult {
  const hasModuleId = recommendations.some((r) => "module_id" in r);
  const recoMap = new Map<string, string>();
  for (const r of recommendations) {
    const key = recoKey(hasModuleId ? r.module_id : null, r.subpoint_id, r.target_level);
    recoMap.set(key, r.recommended_tasks);
  }

  const problemsBySubpoint = new Map<string, ProblemRow[]>();
  for (const p of problems) {
    const list = problemsBySubpoint.get(p.subpoint_id) ?? [];
    list.push(p);
    problemsBySubpoint.set(p.subpoint_id, list);
  }

  // Node 4: every scored problem statement, regardless of which sub-point it belongs to.
  // weighted_gap chains all three weight tiers so it's directly comparable to a
  // ScoredSubpoint's weighted_gap in a merged priority list.
  const scoredProblems: ScoredProblem[] = [];
  for (const row of moduleRows) {
    const subProblems = problemsBySubpoint.get(row.subpoint_id);
    if (!subProblems) continue;
    for (const p of subProblems) {
      const score = problemScores.get(p.problem_id);
      if (score === undefined) continue;

      const target = (score < 5 ? Math.min(score + 1, 5) : 5) as ScoreValue;
      const weightedGap = (5 - score) * p.problem_weight * row.subpoint_weight * row.area_weight;
      const tasks =
        score >= 5 ? "" : recoMap.get(recoKey(hasModuleId ? p.module_id : null, p.problem_id, target)) ?? "";

      scoredProblems.push({
        ...p,
        area_id: row.area_id,
        area_name: row.area_name,
        subpoint_name: row.subpoint_name,
        score,
        observation: observations.get(p.problem_id) ?? "",
        photo: photos.get(p.problem_id),
        level_name: LEVEL_NAME[score],
        target,
        target_name: LEVEL_NAME[target],
        weighted_gap: weightedGap,
        tasks,
      });
    }
  }
  const scoredProblemsBySubpoint = new Map<string, ScoredProblem[]>();
  for (const sp of scoredProblems) {
    const list = scoredProblemsBySubpoint.get(sp.subpoint_id) ?? [];
    list.push(sp);
    scoredProblemsBySubpoint.set(sp.subpoint_id, list);
  }

  const scored: ScoredSubpoint[] = [];
  for (const row of moduleRows) {
    const subProblems = problemsBySubpoint.get(row.subpoint_id);
    let score: number | undefined;

    if (subProblems && subProblems.length > 0) {
      const scoredForSub = scoredProblemsBySubpoint.get(row.subpoint_id) ?? [];
      if (scoredForSub.length > 0) {
        const w = sum(scoredForSub.map((p) => p.problem_weight));
        score = w
          ? sum(scoredForSub.map((p) => p.score * p.problem_weight)) / w
          : mean(scoredForSub.map((p) => p.score));
      }
    }
    if (score === undefined) score = scores.get(row.subpoint_id); // fallback: direct score (or none)
    if (score === undefined) continue; // truly un-scored - excluded, same as the Python between(1,5) filter

    const roundedScore = Math.round(score) as ScoreValue;
    const target = score < 5 ? Math.min(roundedScore + 1, 5) : 5;
    const weightedGap = (5 - score) * row.subpoint_weight * row.area_weight;
    const tasks =
      score >= 5 ? "" : recoMap.get(recoKey(hasModuleId ? row.module_id : null, row.subpoint_id, target)) ?? "";

    scored.push({
      ...row,
      score,
      observation: observations.get(row.subpoint_id) ?? "",
      photo: photos.get(row.subpoint_id),
      level_name: LEVEL_NAME[roundedScore] ?? "",
      target,
      target_name: LEVEL_NAME[target as ScoreValue] ?? "",
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
        area_weight: Number(rows[0].area_weight),
        area_score: areaScore,
        n_scored: rows.length,
      };
    })
    .sort((a, b) => compareAreaIds(a.area_id, b.area_id));

  let moduleScore = 0;
  if (areaScores.length) {
    const aw = sum(areaScores.map((a) => a.area_weight));
    moduleScore = aw
      ? sum(areaScores.map((a) => a.area_score * a.area_weight)) / aw
      : mean(areaScores.map((a) => a.area_score));
  }

  return {
    scored,
    scored_problems: scoredProblems,
    area_scores: areaScores,
    module_score: moduleScore,
    pct: (moduleScore / 5) * 100,
    n_scored: scored.length,
    n_total: moduleRows.length,
  };
}

function recoKey(moduleId: string | null, id: string, targetLevel: number): string {
  return `${moduleId ?? ""}::${id}::${targetLevel}`;
}

/** Google Sheets' API returns every cell as a string (its FORMATTED_VALUE default), but
 * MasterRow/ProblemRow's weight fields are typed number - the type doesn't hold at runtime
 * for live-sheet data. `a + b` on two such strings concatenates ("0.33"+"0.33" ->
 * "0.330.33") instead of adding, which then fails to parse as a number anywhere downstream
 * - Number(b) coerces per element so the reduce always adds, regardless of source. */
function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + Number(b), 0);
}

function mean(xs: number[]): number {
  return xs.length ? sum(xs) / xs.length : 0;
}

/** Parses a completed checklist upload's raw {subpoint_id, problem_id?, score, observation}
 * rows into the Map inputs computeDiagnostic() expects. Only scores 1-5 are kept - mirrors
 * app.py's parse_uploaded_checklist() + the `between(1, 5)` filter applied at diagnostic
 * time. Rows with a problem_id (Node-4 rows in a checklist that was exported for an area
 * broken down that granularly) route into problemScores instead of scores, keeping the
 * offline path in sync with the in-app "Score in-app" flow. */
export function toScoreMaps(rows: SubpointScore[]): {
  scores: Map<string, ScoreValue>;
  problemScores: Map<string, ScoreValue>;
  observations: Map<string, string>;
} {
  const scores = new Map<string, ScoreValue>();
  const problemScores = new Map<string, ScoreValue>();
  const observations = new Map<string, string>();
  for (const r of rows) {
    if (r.score < 1 || r.score > 5) continue;
    const id = r.problem_id || r.subpoint_id;
    (r.problem_id ? problemScores : scores).set(id, r.score);
    if (r.observation) observations.set(id, r.observation);
  }
  return { scores, problemScores, observations };
}
