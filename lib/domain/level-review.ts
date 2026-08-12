import type { KbReviewStatus } from "./types";

/** Reviewer sign-off state for one of a sub-point's 5 maturity levels - stored in the
 * Master sheet's "level_review" column (one combined cell per sub-point, one line per
 * level) so it's directly legible in Excel, not a separate hidden format. */
export interface LevelReviewEntry {
  level: 1 | 2 | 3 | 4 | 5;
  approved: boolean;
  comment: string;
}

const LEVELS: (1 | 2 | 3 | 4 | 5)[] = [1, 2, 3, 4, 5];

export const DEFAULT_LEVEL_REVIEW: LevelReviewEntry[] = LEVELS.map((level) => ({
  level,
  approved: false,
  comment: "",
}));

const LINE_RE = /^([1-5])\s*\[(APPROVED|PENDING)\]\s*-\s*(.*)$/;

/** Parses the "level_review" cell text into exactly 5 entries (levels 1-5, in order).
 * Never throws - malformed or empty input degrades to all-pending, same
 * graceful-fallback contract used elsewhere in this codebase (e.g. loadProblems()). */
export function parseLevelReview(raw: string | undefined | null): LevelReviewEntry[] {
  const found = new Map<number, LevelReviewEntry>();
  for (const line of (raw ?? "").split("\n")) {
    const match = LINE_RE.exec(line.trim());
    if (!match) continue;
    const level = Number(match[1]) as 1 | 2 | 3 | 4 | 5;
    found.set(level, { level, approved: match[2] === "APPROVED", comment: match[3].trim() });
  }
  return LEVELS.map((level) => found.get(level) ?? { level, approved: false, comment: "" });
}

/** Inverse of parseLevelReview() - always emits exactly 5 lines in level order. Comment
 * newlines are stripped since the format is one line per level. */
export function serializeLevelReview(entries: LevelReviewEntry[]): string {
  const byLevel = new Map(entries.map((e) => [e.level, e]));
  return LEVELS.map((level) => {
    const e = byLevel.get(level) ?? { level, approved: false, comment: "" };
    const comment = e.comment.replace(/[\r\n]+/g, " ").trim();
    return `${level} [${e.approved ? "APPROVED" : "PENDING"}] - ${comment}`;
  }).join("\n");
}

/** Returns a new entries array with only the targeted level's fields overwritten. */
export function patchLevelReview(
  entries: LevelReviewEntry[],
  level: 1 | 2 | 3 | 4 | 5,
  patch: { approved?: boolean; comment?: string }
): LevelReviewEntry[] {
  return entries.map((e) => (e.level === level ? { ...e, ...patch } : e));
}

/** Content-authoring review status, derived from the 5 levels' approval state - not
 * independently editable. All 5 approved -> Closed; some approved or commented-on ->
 * Needs review; otherwise -> Pending. */
export function deriveReviewStatus(entries: LevelReviewEntry[]): KbReviewStatus {
  if (entries.every((e) => e.approved)) return "Closed";
  if (entries.some((e) => e.approved || e.comment.trim() !== "")) return "Needs review";
  return "Pending";
}
