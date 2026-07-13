import type { MasterRow } from "./types";

export interface AreaGroup {
  area_id: string;
  area_name: string;
  area_weight: number;
  subpoints: MasterRow[];
}

/** Groups a single module's rows by area, sorted by area_id then subpoint_id - mirrors
 * app.py's `module_df.groupby("area_id")` iteration order used to render the score form. */
export function groupByArea(moduleRows: MasterRow[]): AreaGroup[] {
  const byArea = new Map<string, MasterRow[]>();
  for (const row of moduleRows) {
    const list = byArea.get(row.area_id) ?? [];
    list.push(row);
    byArea.set(row.area_id, list);
  }
  return [...byArea.entries()]
    .map(([area_id, rows]) => ({
      area_id,
      area_name: rows[0].area_name,
      area_weight: rows[0].area_weight,
      subpoints: [...rows].sort((a, b) => a.subpoint_id.localeCompare(b.subpoint_id)),
    }))
    .sort((a, b) => a.area_id.localeCompare(b.area_id));
}

export interface ModuleOption {
  module_id: string;
  module_name: string;
}

export function listModules(masters: MasterRow[]): ModuleOption[] {
  const seen = new Map<string, string>();
  for (const row of masters) seen.set(row.module_id, row.module_name);
  return [...seen.entries()]
    .map(([module_id, module_name]) => ({ module_id, module_name }))
    .sort((a, b) => a.module_id.localeCompare(b.module_id));
}
