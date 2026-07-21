import type { MasterRow } from "./types";

export interface AreaGroup {
  area_id: string;
  area_name: string;
  area_weight: number;
  subpoints: MasterRow[];
}

const numericCompare = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true });

/** Display order for the FnV Warehouse Diagnostic (FNV_WH_V1), matching how the operation
 * actually runs rather than the order areas happened to be added in: plan/source -> inward
 * -> storage & layout -> replenish/fulfill -> loss & exceptions -> oversight & enablement.
 * area_id (A1..A18) stays the stable key used by Masters/Problems/Recommendations and every
 * subpoint_id/problem_id built from it - this only reorders how areas are *displayed*. Any
 * area_id not listed here (a future addition, or another module) falls back to numeric
 * area_id order. */
const AREA_DISPLAY_ORDER = [
  "A14", // Market Intelligence & Benchmarking - plan/forecast
  "A8", // Vendor & Collection Center Operations - source
  "A1", // Inward & Quality Grading - inward
  "A2", // Cold Chain & Storage Conditions - storage
  "A3", // Put-Away & Slotting - storage
  "A4", // Inventory & Shelf-Life Management - storage
  "A9", // Warehouse Flow & Layout - storage/flow
  "A5", // Replenishment & Demand Planning - outbound prep
  "A20", // Picking Productivity - outbound prep
  "A6", // Pick-Pack & Fulfillment Accuracy - outbound prep
  "A21", // Packing Operations - outbound prep
  "A19", // Outbound Dispatch & Load Management - outbound
  "A7", // Spoilage & Wastage Management - loss & exceptions
  "A10", // Rejection Handling - loss & exceptions
  "A11", // Returns Management - loss & exceptions
  "A12", // Complaints Management - loss & exceptions
  "A13", // Control Tower - oversight
  "A17", // Metrics & Visibility - oversight
  "A18", // Cost Diagnostics - oversight
  "A22", // Warehouse Safety & Compliance - oversight
  "A23", // Third-Party Labor & Outsourced Operations Governance - oversight
  "A24", // SKU Expansion & Scalability Readiness - oversight
  "A15", // Training Plan - enablement
  "A16", // People / Workforce - enablement
];
const AREA_ORDER_RANK = new Map(AREA_DISPLAY_ORDER.map((id, i) => [id, i]));

export function compareAreaIds(a: string, b: string): number {
  const ra = AREA_ORDER_RANK.get(a);
  const rb = AREA_ORDER_RANK.get(b);
  if (ra !== undefined && rb !== undefined) return ra - rb;
  if (ra !== undefined) return -1;
  if (rb !== undefined) return 1;
  return numericCompare(a, b);
}

/** Groups a single module's rows by area, sorted by operational flow (see
 * compareAreaIds), sub-points within an area sorted by subpoint_id. */
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
