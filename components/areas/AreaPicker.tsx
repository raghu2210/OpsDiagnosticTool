"use client";

import { Check } from "lucide-react";
import type { AreaGroup } from "@/lib/domain/grouping";

/** Shared "select one or more Areas" grid, used by both Build and Diagnose. A flat grid
 * of area cards - the module now has 7 areas (down from 24 pre-restructure), which is
 * already scannable without a category accordion on top. */
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
        {areas.map((area) => {
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
              <div className="font-code text-xs text-neutral">weight {(area.area_weight * 100).toFixed(0)}%</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
