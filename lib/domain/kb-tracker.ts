import { COLOR } from "@/styles/tokens";
import { compareAreaIds } from "./grouping";
import type { KbReviewStatus, KbTrackerRow } from "./types";

/** Maps content-review status onto the app's existing semantic palette - reuses the same
 * red/amber/green tokens the Sync Tracker and score bands already use, rather than
 * inventing a second color system for a third status meaning. */
export function reviewStatusColor(status: KbReviewStatus): string {
  switch (status) {
    case "Closed":
      return COLOR.green;
    case "Needs review":
      return COLOR.amber;
    case "Pending":
      return COLOR.red;
    default:
      return COLOR.neutral;
  }
}

export const REVIEW_STATUS_ORDER: KbReviewStatus[] = ["Closed", "Needs review", "Pending"];

export interface KbAreaGroup {
  area_id: string;
  area_name: string;
  subpoints: KbTrackerRow[];
  counts: Record<string, number>;
}

/** Groups KB Tracker rows by area (same area_id order as groupByArea) and tallies each
 * area's status counts, so the UI can render a rollup row plus a drill-down list without
 * recomputing counts per render. */
export function groupKbTrackerByArea(rows: KbTrackerRow[]): KbAreaGroup[] {
  const byArea = new Map<string, KbTrackerRow[]>();
  for (const row of rows) {
    const list = byArea.get(row.area_id) ?? [];
    list.push(row);
    byArea.set(row.area_id, list);
  }
  return [...byArea.entries()]
    .map(([area_id, areaRows]) => {
      const counts: Record<string, number> = {};
      for (const r of areaRows) counts[r.review_status] = (counts[r.review_status] ?? 0) + 1;
      return {
        area_id,
        area_name: areaRows[0].area_name,
        subpoints: [...areaRows].sort((a, b) => a.subpoint_id.localeCompare(b.subpoint_id, undefined, { numeric: true })),
        counts,
      };
    })
    .sort((a, b) => compareAreaIds(a.area_id, b.area_id));
}
