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

export type ScoreValue = 1 | 2 | 3 | 4 | 5;

export interface SubpointScore {
  subpoint_id: string;
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
  score: ScoreValue;
  observation: string;
  level_name: string;
  target: ScoreValue;
  target_name: string;
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
