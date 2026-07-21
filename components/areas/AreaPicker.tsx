"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { AreaGroup } from "@/lib/domain/grouping";
import { groupAreasByCategory } from "@/lib/domain/grouping";

/** Shared "select one or more Areas" grid, used by both Build and Diagnose. Groups the
 * module's areas into thematic categories (see AREA_CATEGORIES in lib/domain/grouping.ts)
 * that expand on click, instead of one flat wall of 24 cards - each category header shows
 * a live selected-count so you don't need to expand it to know what's picked. */
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
  const categories = groupAreasByCategory(areas);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleCategory(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
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

      <div className="space-y-2">
        {categories.map((cat) => {
          const isOpen = expanded.has(cat.id);
          const pickedCount = cat.areas.filter((a) => selected.has(a.area_id)).length;
          return (
            <div key={cat.id} className="border border-rule rounded-sm bg-surface shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className="w-full flex items-center justify-between gap-4 px-4 py-3 text-left hover:bg-black/[0.02] transition-colors"
              >
                <span className="text-sm font-medium">{cat.name}</span>
                <span className="flex items-center gap-3 shrink-0">
                  <span className="font-code text-xs text-neutral">
                    {pickedCount > 0 ? (
                      <span className="text-accent font-medium">{pickedCount}</span>
                    ) : (
                      0
                    )}{" "}
                    / {cat.areas.length} selected
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </span>
              </button>

              {isOpen && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 px-4 pb-4 pt-1">
                  {cat.areas.map((area) => {
                    const picked = selected.has(area.area_id);
                    return (
                      <button
                        type="button"
                        key={area.area_id}
                        onClick={() => onToggle(area.area_id)}
                        className={`text-left px-4 py-3 rounded-sm border shadow-sm transition-colors ${
                          picked ? "border-accent bg-accent/5" : "border-rule bg-paper hover:border-charcoal"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-code text-xs text-neutral">{area.area_id}</span>
                          {picked && <Check className="w-4 h-4 text-accent" />}
                        </div>
                        <div className="text-sm font-medium mb-0.5">{area.area_name}</div>
                        <div className="font-code text-xs text-neutral">
                          weight {(area.area_weight * 100).toFixed(0)}%
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
