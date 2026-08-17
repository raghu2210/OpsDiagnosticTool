"use client";

import { useMemo, useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import type { AreaGroup } from "@/lib/domain/grouping";
import { groupActivityAreas } from "@/lib/domain/activity-groups";

/** Allocates 100 whole percentage points across a set of weights so the displayed integers
 * always sum to exactly 100 - the "largest remainder" method. Rounding each area's share
 * independently (e.g. plain toFixed(0)) doesn't reliably sum back to 100 (a handful of
 * 0.5%-ish areas can each round the "wrong" way and land the total on 99 or 101, under any
 * weighting scheme - default, a preset profile, or AI-generated). Every area gets its floor
 * share first, then the few leftover points go to the areas with the largest fractional
 * remainder, so the total is exact by construction rather than by luck. */
function allocatePercents<T extends { key: string; weight: number }>(items: T[]): Map<string, number> {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  if (total <= 0) return new Map(items.map((i) => [i.key, 0]));

  const shares = items.map((i) => {
    const exact = (i.weight / total) * 100;
    return { key: i.key, floor: Math.floor(exact), remainder: exact - Math.floor(exact) };
  });

  const allocated = shares.reduce((sum, s) => sum + s.floor, 0);
  const leftover = Math.min(Math.max(100 - allocated, 0), shares.length);
  const byRemainder = [...shares].sort((a, b) => b.remainder - a.remainder);

  const result = new Map(shares.map((s) => [s.key, s.floor]));
  for (let i = 0; i < leftover; i++) {
    const key = byRemainder[i].key;
    result.set(key, (result.get(key) ?? 0) + 1);
  }
  return result;
}

/** Shared "select one or more Areas" picker, used by Diagnose. Two-level drill-down: a
 * 3-per-row grid of Modules (higher-level groupings of Areas), then drilling into a Module
 * shows its Areas in the same 3-per-row grid for actual selection. Replaced the old flat
 * 25-area grid, which stopped being scannable once the module grew past ~7 areas. */
export function AreaPicker({
  areas,
  selected,
  onToggle,
  onSelectAll,
  onClear,
}: {
  areas: AreaGroup[];
  selected: Set<string>;
  onToggle: (areaId: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
}) {
  const buckets = useMemo(() => groupActivityAreas(areas), [areas]);
  // Allocated once across every area in the module, so area-level badges sum to exactly
  // 100 - group-level badges then just sum their member areas' already-allocated integers,
  // which keeps the group total exact too (it's the same 100 points, just regrouped).
  const areaPercents = useMemo(
    () => allocatePercents(areas.map((a) => ({ key: a.area_id, weight: Number(a.area_weight) }))),
    [areas]
  );
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);

  function groupPercent(groupAreas: AreaGroup[]): number {
    return groupAreas.reduce((sum, a) => sum + (areaPercents.get(a.area_id) ?? 0), 0);
  }

  const openBucket = buckets.find((b) => b.group.group_id === openGroupId) ?? null;

  if (openBucket) {
    const visibleIds = openBucket.areas.map((a) => a.area_id);
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpenGroupId(null)}
          className="text-sm font-medium text-neutral hover:text-ink mb-3 inline-flex items-center gap-1"
        >
          <ChevronRight className="w-3.5 h-3.5 rotate-180" />
          Back to modules
        </button>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="font-code text-sm text-neutral">{openBucket.group.group_id}</span>
          <h4 className="font-display text-base font-medium">{openBucket.group.group_name}</h4>
          <span className="font-code text-xs text-neutral ml-auto">weight {groupPercent(openBucket.areas)}%</span>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => visibleIds.forEach((id) => !selected.has(id) && onToggle(id))}
            className="text-sm font-medium px-3 py-1.5 rounded-xs border border-rule hover:border-accent transition-colors"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={() => visibleIds.forEach((id) => selected.has(id) && onToggle(id))}
            className="text-sm font-medium px-3 py-1.5 rounded-xs border border-rule hover:border-accent transition-colors"
          >
            Clear
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {openBucket.areas.map((area) => {
            const picked = selected.has(area.area_id);
            return (
              <button
                type="button"
                key={area.area_id}
                onClick={() => onToggle(area.area_id)}
                className={`text-left px-4 py-3 rounded-sm border shadow-sm transition-colors ${
                  picked ? "border-accent bg-accent/5" : "border-rule bg-surface hover:border-charcoal"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-code text-xs text-neutral">{area.area_id}</span>
                  {picked && <Check className="w-4 h-4 text-accent" />}
                </div>
                <div className="text-sm font-medium mb-0.5">{area.area_name}</div>
                <div className="font-code text-xs text-neutral">weight {areaPercents.get(area.area_id) ?? 0}%</div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={onSelectAll}
          className="text-sm font-medium px-3 py-1.5 rounded-xs border border-rule hover:border-accent transition-colors"
        >
          Select all
        </button>
        <button
          type="button"
          onClick={onClear}
          className="text-sm font-medium px-3 py-1.5 rounded-xs border border-rule hover:border-accent transition-colors"
        >
          Clear
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {buckets.map(({ group, areas: groupAreas }) => {
          const selectedCount = groupAreas.filter((a) => selected.has(a.area_id)).length;
          return (
            <button
              type="button"
              key={group.group_id}
              onClick={() => setOpenGroupId(group.group_id)}
              className={`text-left px-4 py-3 rounded-sm border shadow-sm transition-colors ${
                selectedCount > 0 ? "border-accent bg-accent/5" : "border-rule bg-surface hover:border-charcoal"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-code text-xs text-neutral">{group.group_id}</span>
                <ChevronRight className="w-4 h-4 text-neutral" />
              </div>
              <div className="text-sm font-medium mb-0.5">{group.group_name}</div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-code text-xs text-neutral">
                  {selectedCount}/{groupAreas.length} selected
                </span>
                <span className="font-code text-xs text-neutral">weight {groupPercent(groupAreas)}%</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
