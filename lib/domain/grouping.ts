import type { MasterRow } from "./types";

export interface AreaGroup {
  area_id: string;
  area_name: string;
  area_weight: number;
  subpoints: MasterRow[];
}

const numericCompare = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true });

/** Plain numeric area_id order (A1, A2, A3, ... A24) - simple and predictable, used
 * everywhere areas are listed (Build, Diagnose, results, PDF exports). */
export function compareAreaIds(a: string, b: string): number {
  return numericCompare(a, b);
}

/** Groups a single module's rows by area, sorted by area_id (see compareAreaIds),
 * sub-points within an area sorted by subpoint_id. */
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
      subpoints: [...rows].sort((a, b) => numericCompare(a.subpoint_id, b.subpoint_id)),
    }))
    .sort((a, b) => compareAreaIds(a.area_id, b.area_id));
}

/** Thematic buckets for the FnV Warehouse Diagnostic's 24 areas - purely a display
 * grouping to make the area-selection grid scannable instead of one flat wall of 24
 * cards. area_id (and every subpoint_id/problem_id/weight built from it) is completely
 * unaffected; this only decides which category header an area's card sits under. Any
 * area_id not listed here falls into "Other" so a future area never silently disappears
 * from the picker. */
export interface AreaCategory {
  id: string;
  name: string;
  areaIds: string[];
}

export const AREA_CATEGORIES: AreaCategory[] = [
  { id: "inbound", name: "Inbound & Quality", areaIds: ["A1", "A2", "A10"] },
  { id: "storage", name: "Storage & Inventory", areaIds: ["A3", "A4", "A9"] },
  { id: "fulfillment", name: "Fulfillment Operations", areaIds: ["A5", "A6", "A19", "A20", "A21"] },
  { id: "loss", name: "Loss, Returns & Complaints", areaIds: ["A7", "A11", "A12"] },
  { id: "vendor", name: "Vendor & Market", areaIds: ["A8", "A14", "A23"] },
  { id: "governance", name: "Governance & Performance", areaIds: ["A13", "A17", "A18", "A22", "A24"] },
  { id: "people", name: "People & Training", areaIds: ["A15", "A16"] },
];

export interface AreaCategoryGroup {
  id: string;
  name: string;
  areas: AreaGroup[];
}

/** Buckets a module's already-grouped areas into AREA_CATEGORIES, preserving each
 * category's areaIds order. Areas not covered by any category (a future addition, or
 * another module) land in a trailing "Other" bucket instead of disappearing. */
export function groupAreasByCategory(areas: AreaGroup[]): AreaCategoryGroup[] {
  const byId = new Map(areas.map((a) => [a.area_id, a]));
  const used = new Set<string>();
  const result: AreaCategoryGroup[] = [];
  for (const cat of AREA_CATEGORIES) {
    const catAreas = cat.areaIds.map((id) => byId.get(id)).filter((a): a is AreaGroup => Boolean(a));
    for (const a of catAreas) used.add(a.area_id);
    if (catAreas.length > 0) result.push({ id: cat.id, name: cat.name, areas: catAreas });
  }
  const rest = areas.filter((a) => !used.has(a.area_id));
  if (rest.length > 0) result.push({ id: "other", name: "Other", areas: rest });
  return result;
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
