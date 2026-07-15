/**
 * Field names deliberately stay snake_case, matching the Masters/Recommendations Google
 * Sheet columns 1:1 (module_id, area_weight, subpoint_id, ...) rather than being renamed to
 * camelCase. This is a data-fidelity choice: every mapping/rename is a place a port can
 * silently diverge from the source of truth (the sheet), so the wire format and the TS type
 * are kept identical on purpose.
 */

export type Status = "active" | "inactive" | string;

export interface MasterRow {
  module_id: string;
  module_name: string;
  area_id: string;
  area_name: string;
  area_weight: number;
  subpoint_id: string;
  subpoint_name: string;
  subpoint_weight: number;
  score_1_desc: string;
  score_2_desc: string;
  score_3_desc: string;
  score_4_desc: string;
  score_5_desc: string;
  version: number | string;
  status: Status;
}

export interface RecommendationRow {
  module_id: string;
  subpoint_id: string;
  subpoint_name: string;
  target_level: number;
  target_level_name: string;
  recommended_tasks: string;
}

/**
 * Node 4 of the diagnostic tree (Module > Area > Sub-point > Problem statement) - the
 * leaf level where scoring actually happens for sub-points that have been broken down
 * this granularly. Same shape as MasterRow's scoring columns, one level deeper.
 * `problem_weight` sums to 1.0 across all problems within a single subpoint_id, mirroring
 * how `subpoint_weight` sums to 1.0 within an area.
 */
export interface ProblemRow {
  module_id: string;
  subpoint_id: string;
  problem_id: string;
  problem_name: string;
  problem_weight: number;
  score_1_desc: string;
  score_2_desc: string;
  score_3_desc: string;
  score_4_desc: string;
  score_5_desc: string;
  version: number | string;
  status: Status;
}

export type ScoreValue = 1 | 2 | 3 | 4 | 5;

export interface SubpointScore {
  subpoint_id: string;
  /** Present only for Node-4 (problem-statement) rows in a filled checklist upload -
   * subpoint_id still identifies the parent sub-point for context, but the scored entity
   * is problem_id when present. */
  problem_id?: string;
  score: ScoreValue;
  observation?: string;
}

export const LEVEL_NAME: Record<ScoreValue, string> = {
  1: "Ad-hoc",
  2: "Basic",
  3: "Standardized",
  4: "Managed",
  5: "Best-in-class",
};

export interface ScoredSubpoint extends MasterRow {
  /** Integer 1-5 for directly-scored sub-points; fractional weighted rollup of its
   * Problem statements' scores for sub-points broken down to Node 4. */
  score: number;
  observation: string;
  /** Base64 data URI, client-resized/compressed. Never persisted server-side - lives only
   * for the duration of the session and gets embedded directly into the exported PDF. */
  photo?: string;
  level_name: string;
  target: number;
  target_name: string;
  weighted_gap: number;
  tasks: string;
}

/** Node 4: a scored Problem statement. Recommendations/observation/photo apply at this
 * level for sub-points that have been broken down this granularly, exactly like
 * ScoredSubpoint does for sub-points that haven't. */
export interface ScoredProblem extends ProblemRow {
  /** Denormalized from the parent MasterRow - ProblemRow itself has no area/subpoint
   * display fields, and a merged priority list needs each item self-contained. */
  area_id: string;
  area_name: string;
  subpoint_name: string;
  score: ScoreValue;
  observation: string;
  photo?: string;
  level_name: string;
  target: ScoreValue;
  target_name: string;
  /** Chains all three weight tiers ((5 - score) * problem_weight * subpoint_weight *
   * area_weight) so it's directly comparable to a ScoredSubpoint's weighted_gap in a
   * merged priority list. */
  weighted_gap: number;
  tasks: string;
}

export interface AreaScore {
  area_id: string;
  area_name: string;
  area_weight: number;
  area_score: number;
  n_scored: number;
}

export interface DiagnosticResult {
  scored: ScoredSubpoint[];
  /** Node-4 items for sub-points broken down into Problem statements. Empty for modules/
   * areas with no Problems data - purely additive. */
  scored_problems: ScoredProblem[];
  area_scores: AreaScore[];
  module_score: number;
  pct: number;
  n_scored: number;
  n_total: number;
}

export interface ModuleSummary {
  module_id: string;
  module_name: string;
  areas: number;
  sub_points: number;
}

// --- Sync Tracker ---
export interface TrackerRow {
  sr_no: string;
  project: string;
  actionable: string;
  owner: string;
  status: string;
  notes: string;
  notes_link: string | null;
  blocker: string;
}
