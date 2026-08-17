import type { MasterRow, WeightProfileRow } from "./types";

export interface WeightProfileOption {
  profile_id: string;
  profile_name: string;
}

/** Distinct profiles available, in first-seen order - same idiom as listModules(). */
export function listWeightProfiles(profiles: WeightProfileRow[]): WeightProfileOption[] {
  const seen = new Map<string, string>();
  for (const row of profiles) seen.set(row.profile_id, row.profile_name);
  return [...seen.entries()].map(([profile_id, profile_name]) => ({ profile_id, profile_name }));
}

/** Shared by applyWeightProfile() and applyCustomWeights(): swap area_weight per area_id
 * where an override exists, otherwise keep the row as-is. Never touches subpoint_weight -
 * a weighting source changes how much an area counts, not how its own sub-points split. */
function overrideAreaWeights(moduleRows: MasterRow[], overrides: Map<string, number>): MasterRow[] {
  if (overrides.size === 0) return moduleRows;
  return moduleRows.map((row) => {
    const override = overrides.get(row.area_id);
    return override === undefined ? row : { ...row, area_weight: override };
  });
}

/** Returns moduleRows with area_weight replaced by the selected profile's override where
 * one exists, otherwise left as the module's own default. Passing a falsy profileId (or a
 * profile with no rows at all) returns moduleRows unchanged - the default equal weighting
 * everyone sees today. */
export function applyWeightProfile(
  moduleRows: MasterRow[],
  profiles: WeightProfileRow[],
  profileId: string | null
): MasterRow[] {
  if (!profileId) return moduleRows;

  // Number(...): same live-Sheets-returns-strings issue as MasterRow's own weight fields
  // (see scoring.ts's sum()) - coerce here so every downstream `+` (module_score's sum of
  // area_weight) adds instead of concatenating, regardless of the sheet's raw types.
  const overrides = new Map<string, number>();
  for (const row of profiles) {
    if (row.profile_id === profileId) overrides.set(row.area_id, Number(row.area_weight));
  }
  return overrideAreaWeights(moduleRows, overrides);
}

/** A named weighting archetype generated on the fly from a free-text description (see
 * /api/diagnostic/weight-profile-ai), rather than looked up from the WeightProfiles sheet.
 * Session-only - never written back to the sheet. */
export interface CustomWeightResult {
  weights: Record<string, number>;
  summary: string;
}

/** Same override mechanism as applyWeightProfile(), but sourced from an AI-generated
 * area_id -> weight map instead of a sheet-backed profile. Passing null (no custom weights
 * generated yet, or the last generation failed) returns moduleRows unchanged. */
export function applyCustomWeights(moduleRows: MasterRow[], weights: Record<string, number> | null): MasterRow[] {
  if (!weights) return moduleRows;
  return overrideAreaWeights(moduleRows, new Map(Object.entries(weights)));
}
