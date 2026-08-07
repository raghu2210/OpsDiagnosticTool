"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { KbTrackerRow } from "@/lib/domain/types";
import { groupKbTrackerByArea, reviewStatusColor, REVIEW_STATUS_ORDER } from "@/lib/domain/kb-tracker";

function StatusPill({ status }: { status: string }) {
  const color = reviewStatusColor(status);
  return (
    <span
      className="font-code text-xs font-medium px-2 py-0.5 rounded-xs text-white shrink-0"
      style={{ backgroundColor: color }}
    >
      {status}
    </span>
  );
}

/**
 * Content-authoring review status by area, with expand-to-drill-down per sub-point -
 * mirrors the same collapsed-by-default accordion pattern already used for Node-4 problem
 * statements in ScoreForm/BuildFlow, applied here to review status instead of scoring.
 * Entirely read-only and separate from the scoring pipeline, same principle as the Sync
 * Tracker page.
 */
export function KbTrackerView({ rows }: { rows: KbTrackerRow[] }) {
  const areas = groupKbTrackerByArea(rows);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(areaId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(areaId) ? next.delete(areaId) : next.add(areaId);
      return next;
    });
  }

  const overallCounts: Record<string, number> = {};
  for (const r of rows) overallCounts[r.review_status] = (overallCounts[r.review_status] ?? 0) + 1;

  if (rows.length === 0) {
    return (
      <p className="text-neutral text-sm border border-dashed border-rule rounded-md px-6 py-8 text-center">
        No KB Tracker data found - check that the knowledge base workbook has a "KB Tracker" sheet.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-8 font-code text-sm py-6 px-6 rounded-md border border-rule bg-surface shadow-sm">
        {REVIEW_STATUS_ORDER.map((status) => (
          <div key={status}>
            <div className="text-2xl font-medium" style={{ color: reviewStatusColor(status) }}>
              {overallCounts[status] ?? 0}
            </div>
            <div className="text-neutral text-xs uppercase tracking-wider mt-1">{status}</div>
          </div>
        ))}
        <div>
          <div className="text-2xl font-medium text-ink">{rows.length}</div>
          <div className="text-neutral text-xs uppercase tracking-wider mt-1">Total sub-points</div>
        </div>
      </div>

      <div className="border border-rule rounded-md bg-surface shadow-sm divide-y divide-rule overflow-hidden">
        {areas.map((area) => {
          const isOpen = expanded.has(area.area_id);
          const dominant = REVIEW_STATUS_ORDER.reduce(
            (best, s) => ((area.counts[s] ?? 0) > (area.counts[best] ?? -1) ? s : best),
            REVIEW_STATUS_ORDER[0]
          );
          return (
            <div key={area.area_id}>
              <button
                type="button"
                onClick={() => toggle(area.area_id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-black/[0.02] transition-colors"
                style={{ borderLeft: `3px solid ${reviewStatusColor(dominant)}` }}
              >
                <ChevronRight
                  className={`w-3.5 h-3.5 shrink-0 text-neutral transition-transform ${isOpen ? "rotate-90" : ""}`}
                />
                <span className="font-code text-xs text-neutral shrink-0">{area.area_id}</span>
                <span className="text-sm font-medium flex-1 min-w-0 truncate">{area.area_name}</span>
                <span className="flex items-center gap-1.5 shrink-0">
                  {REVIEW_STATUS_ORDER.filter((s) => area.counts[s]).map((s) => (
                    <span key={s} className="font-code text-xs" style={{ color: reviewStatusColor(s) }}>
                      {area.counts[s]} {s.toLowerCase()}
                    </span>
                  ))}
                </span>
              </button>
              {isOpen && (
                <div className="divide-y divide-rule bg-black/[0.015]">
                  {area.subpoints.map((sp) => (
                    <div key={sp.subpoint_id} className="flex items-center gap-3 pl-11 pr-4 py-2.5">
                      <span className="font-code text-xs text-neutral shrink-0">{sp.subpoint_id}</span>
                      <span className="text-sm flex-1 min-w-0 truncate">{sp.subpoint_name}</span>
                      <StatusPill status={sp.review_status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
