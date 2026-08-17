import type { AreaGroup } from "./grouping";

/** "Activity group" is a UI-only grouping of Areas into 9 higher-level modules for the
 * Diagnose drill-down nav. Deliberately not called "Module" in code - that term already
 * means the diagnostic module (module_id/module_name, e.g. WH_V1). Purely a display
 * lookup keyed by area_id; carries no scoring weight and isn't persisted anywhere. */
export interface ActivityGroup {
  group_id: string;
  group_name: string;
  area_ids: string[];
}

export const ACTIVITY_GROUPS: ActivityGroup[] = [
  { group_id: "M1", group_name: "Collection Centers", area_ids: ["A15", "A23"] },
  { group_id: "M2", group_name: "Planning", area_ids: ["A13"] },
  {
    group_id: "M3",
    group_name: "Warehouse Ops",
    area_ids: ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10", "A20", "A21"],
  },
  { group_id: "M4", group_name: "Middle Mile", area_ids: ["A17", "A18"] },
  { group_id: "M5", group_name: "Dark Store Ops + Cold Chain", area_ids: ["A16", "A22"] },
  { group_id: "M6", group_name: "Warehouse Design + Expansion", area_ids: ["A14", "A24"] },
  { group_id: "M7", group_name: "Quality (QMS + Training + Safety)", area_ids: ["A11", "A25"] },
  { group_id: "M8", group_name: "Process Design", area_ids: ["A12"] },
  { group_id: "M9", group_name: "Control Tower", area_ids: ["A19"] },
];

export interface ActivityGroupBucket {
  group: ActivityGroup;
  areas: AreaGroup[];
}

/** Buckets a module's AreaGroup[] into the 9 ActivityGroups, preserving ACTIVITY_GROUPS
 * order and each group's declared area order. Any area_id not covered by ACTIVITY_GROUPS
 * (e.g. a future module with different areas) falls into a trailing "Other" bucket rather
 * than silently disappearing. */
export function groupActivityAreas(areas: AreaGroup[]): ActivityGroupBucket[] {
  const byId = new Map(areas.map((a) => [a.area_id, a]));
  const covered = new Set<string>();

  const buckets: ActivityGroupBucket[] = ACTIVITY_GROUPS.map((group) => {
    const groupAreas: AreaGroup[] = [];
    for (const areaId of group.area_ids) {
      const area = byId.get(areaId);
      if (area) {
        groupAreas.push(area);
        covered.add(areaId);
      }
    }
    return { group, areas: groupAreas };
  }).filter((bucket) => bucket.areas.length > 0);

  const orphaned = areas.filter((a) => !covered.has(a.area_id));
  if (orphaned.length > 0) {
    buckets.push({
      group: { group_id: "OTHER", group_name: "Other", area_ids: orphaned.map((a) => a.area_id) },
      areas: orphaned,
    });
  }

  return buckets;
}
