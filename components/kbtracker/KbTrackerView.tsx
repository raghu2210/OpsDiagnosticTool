"use client";

import { useMemo, useRef, useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import type { KbTrackerRow, MasterRow } from "@/lib/domain/types";
import { LEVEL_NAME } from "@/lib/domain/types";
import { groupKbTrackerByArea, reviewStatusColor, REVIEW_STATUS_ORDER } from "@/lib/domain/kb-tracker";
import { parseLevelReview, type LevelReviewEntry } from "@/lib/domain/level-review";

interface LevelPatch {
  approved?: boolean;
  comment?: string;
}

interface LevelSaveResult {
  ok: boolean;
  error?: string;
  level_review?: string;
  review_status?: string;
}

async function saveLevelReview(subpointId: string, level: number, patch: LevelPatch): Promise<LevelSaveResult> {
  try {
    const res = await fetch("/api/kb-tracker/level-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subpoint_id: subpointId, level, ...patch }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error ?? "Failed to save" };
    return { ok: true, level_review: data.level_review, review_status: data.review_status };
  } catch {
    return { ok: false, error: "Failed to save - check your connection" };
  }
}

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

/** One maturity level (1-5) within a sub-point: its rubric description plus the
 * reviewer's approve tick and comment for that level specifically. Comment saves on blur
 * (not keystroke-by-keystroke), matching the auto-score observation field's pattern. */
function LevelReviewRow({
  level,
  desc,
  entry,
  subpointId,
  onSaved,
}: {
  level: 1 | 2 | 3 | 4 | 5;
  desc: string;
  entry: LevelReviewEntry;
  subpointId: string;
  onSaved: (result: LevelSaveResult) => void;
}) {
  const [comment, setComment] = useState(entry.comment);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastSaved = useRef(entry.comment);

  async function toggleApproved() {
    setApproving(true);
    setError(null);
    const result = await saveLevelReview(subpointId, level, { approved: !entry.approved });
    if (result.ok) onSaved(result);
    else setError(result.error ?? "Failed to save");
    setApproving(false);
  }

  async function commitComment() {
    if (comment === lastSaved.current) return;
    setError(null);
    const result = await saveLevelReview(subpointId, level, { comment });
    if (result.ok) {
      lastSaved.current = comment;
      onSaved(result);
    } else {
      setError(result.error ?? "Failed to save");
    }
  }

  return (
    <div className="flex items-start gap-2.5 text-sm">
      <button
        type="button"
        onClick={toggleApproved}
        disabled={approving}
        title={entry.approved ? "Approved by reviewer - click to unapprove" : "Mark this level as approved"}
        className={`shrink-0 mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
          entry.approved
            ? "bg-green border-green text-white"
            : "border-rule text-neutral hover:border-green hover:text-green"
        }`}
      >
        <Check className="w-2.5 h-2.5" />
      </button>
      <div className="flex-1 min-w-0">
        <span>
          <span className="font-medium">{LEVEL_NAME[level]}:</span>{" "}
          <span className="text-neutral">{desc || "No description authored yet."}</span>
        </span>
        <textarea
          rows={1}
          placeholder="Comment if this level needs a change (optional)"
          className="w-full text-sm bg-transparent mt-1 focus:outline-none placeholder:text-neutral/70 resize-none leading-normal"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onBlur={commitComment}
        />
        {error && <p className="text-xs text-red mt-0.5">{error}</p>}
      </div>
    </div>
  );
}

/** The 5 maturity levels for one sub-point, revealed when its row is clicked - each level
 * shows its rubric text (score_1_desc..score_5_desc from the Master sheet) alongside its
 * own approve tick and comment, parsed from Master's "level_review" column. */
function LevelDescriptions({
  master,
  subpointId,
  onLevelSaved,
}: {
  master: MasterRow | undefined;
  subpointId: string;
  onLevelSaved: (result: LevelSaveResult) => void;
}) {
  if (!master) {
    return <p className="text-sm text-neutral pl-11 pr-4 pb-3">No maturity descriptions found for this sub-point.</p>;
  }
  const descs: Record<1 | 2 | 3 | 4 | 5, string> = {
    1: master.score_1_desc,
    2: master.score_2_desc,
    3: master.score_3_desc,
    4: master.score_4_desc,
    5: master.score_5_desc,
  };
  const entries = parseLevelReview(master.level_review);
  return (
    <div className="pl-11 pr-4 pb-3 space-y-3">
      {entries.map((entry) => (
        <LevelReviewRow
          key={entry.level}
          level={entry.level}
          desc={descs[entry.level]}
          entry={entry}
          subpointId={subpointId}
          onSaved={onLevelSaved}
        />
      ))}
    </div>
  );
}

/** One sub-point row, expandable on click to reveal its 1-5 maturity levels, each with its
 * own approve tick + comment. Shared by both the Area-grouped and Status-grouped views. */
function SubpointRow({
  row,
  areaLabel,
  master,
  isOpen,
  onToggle,
  onLevelSaved,
}: {
  row: KbTrackerRow;
  areaLabel?: string;
  master: MasterRow | undefined;
  isOpen: boolean;
  onToggle: () => void;
  onLevelSaved: (result: LevelSaveResult) => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 pl-11 pr-4 py-2.5 text-left hover:bg-black/[0.03] transition-colors"
      >
        <ChevronRight
          className={`w-3 h-3 shrink-0 text-neutral transition-transform ${isOpen ? "rotate-90" : ""}`}
        />
        <span className="font-code text-xs text-neutral shrink-0">{row.subpoint_id}</span>
        {areaLabel && <span className="font-code text-xs text-neutral/70 shrink-0">{areaLabel}</span>}
        <span className="text-sm flex-1 min-w-0 truncate">{row.subpoint_name}</span>
        {row.review_status === "Closed" && <Check className="w-3.5 h-3.5 text-green shrink-0" />}
        <StatusPill status={row.review_status} />
      </button>
      {isOpen && <LevelDescriptions master={master} subpointId={row.subpoint_id} onLevelSaved={onLevelSaved} />}
    </div>
  );
}

type ViewMode = "area" | "status";

export function KbTrackerView({
  rows: initialRows,
  masters: initialMasters,
}: {
  rows: KbTrackerRow[];
  masters: MasterRow[];
}) {
  const [rows, setRows] = useState(initialRows);
  const [masters, setMasters] = useState(initialMasters);
  const [view, setView] = useState<ViewMode>("area");
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
  const [expandedStatuses, setExpandedStatuses] = useState<Set<string>>(new Set());
  const [expandedSubpoints, setExpandedSubpoints] = useState<Set<string>>(new Set());

  function applyLevelReview(subpointId: string, result: LevelSaveResult) {
    if (result.level_review !== undefined) {
      setMasters((prev) => prev.map((m) => (m.subpoint_id === subpointId ? { ...m, level_review: result.level_review! } : m)));
    }
    if (result.review_status !== undefined) {
      setRows((prev) => prev.map((r) => (r.subpoint_id === subpointId ? { ...r, review_status: result.review_status! } : r)));
    }
  }

  const masterBySubpoint = useMemo(() => new Map(masters.map((m) => [m.subpoint_id, m])), [masters]);
  const areas = useMemo(() => groupKbTrackerByArea(rows), [rows]);

  const byStatus = useMemo(() => {
    const map = new Map<string, KbTrackerRow[]>();
    for (const status of REVIEW_STATUS_ORDER) map.set(status, []);
    for (const r of rows) {
      const list = map.get(r.review_status) ?? [];
      list.push(r);
      map.set(r.review_status, list);
    }
    return map;
  }, [rows]);

  function toggleArea(areaId: string) {
    setExpandedAreas((prev) => {
      const next = new Set(prev);
      next.has(areaId) ? next.delete(areaId) : next.add(areaId);
      return next;
    });
  }
  function toggleStatus(status: string) {
    setExpandedStatuses((prev) => {
      const next = new Set(prev);
      next.has(status) ? next.delete(status) : next.add(status);
      return next;
    });
  }
  function toggleSubpoint(subpointId: string) {
    setExpandedSubpoints((prev) => {
      const next = new Set(prev);
      next.has(subpointId) ? next.delete(subpointId) : next.add(subpointId);
      return next;
    });
  }

  const overallCounts: Record<string, number> = {};
  for (const r of rows) overallCounts[r.review_status] = (overallCounts[r.review_status] ?? 0) + 1;

  if (rows.length === 0) {
    return (
      <p className="text-neutral text-sm border border-dashed border-rule rounded-md px-6 py-8 text-center">
        No KB Tracker data found - check that the knowledge base workbook has a &quot;KB Tracker&quot; sheet.
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

      <div className="flex gap-1 border-b border-rule">
        {(
          [
            ["area", "Group by Area"],
            ["status", "Group by Status"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`text-sm font-medium px-4 py-2.5 border-b-2 -mb-px transition-colors ${
              view === key ? "border-accent text-ink" : "border-transparent text-neutral hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "area" ? (
        <div className="border border-rule rounded-md bg-surface shadow-sm divide-y divide-rule overflow-hidden">
          {areas.map((area) => {
            const isOpen = expandedAreas.has(area.area_id);
            const dominant = REVIEW_STATUS_ORDER.reduce(
              (best, s) => ((area.counts[s] ?? 0) > (area.counts[best] ?? -1) ? s : best),
              REVIEW_STATUS_ORDER[0]
            );
            return (
              <div key={area.area_id}>
                <button
                  type="button"
                  onClick={() => toggleArea(area.area_id)}
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
                      <SubpointRow
                        key={sp.subpoint_id}
                        row={sp}
                        master={masterBySubpoint.get(sp.subpoint_id)}
                        isOpen={expandedSubpoints.has(sp.subpoint_id)}
                        onToggle={() => toggleSubpoint(sp.subpoint_id)}
                        onLevelSaved={(result) => applyLevelReview(sp.subpoint_id, result)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border border-rule rounded-md bg-surface shadow-sm divide-y divide-rule overflow-hidden">
          {REVIEW_STATUS_ORDER.map((status) => {
            const statusRows = byStatus.get(status) ?? [];
            const isOpen = expandedStatuses.has(status);
            return (
              <div key={status}>
                <button
                  type="button"
                  onClick={() => toggleStatus(status)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-black/[0.02] transition-colors"
                  style={{ borderLeft: `3px solid ${reviewStatusColor(status)}` }}
                >
                  <ChevronRight
                    className={`w-3.5 h-3.5 shrink-0 text-neutral transition-transform ${isOpen ? "rotate-90" : ""}`}
                  />
                  <span className="text-sm font-medium flex-1" style={{ color: reviewStatusColor(status) }}>
                    {status}
                  </span>
                  <span className="font-code text-xs text-neutral shrink-0">{statusRows.length} sub-points</span>
                </button>
                {isOpen && (
                  <div className="divide-y divide-rule bg-black/[0.015]">
                    {statusRows.map((sp) => (
                      <SubpointRow
                        key={sp.subpoint_id}
                        row={sp}
                        areaLabel={sp.area_id}
                        master={masterBySubpoint.get(sp.subpoint_id)}
                        isOpen={expandedSubpoints.has(sp.subpoint_id)}
                        onToggle={() => toggleSubpoint(sp.subpoint_id)}
                        onLevelSaved={(result) => applyLevelReview(sp.subpoint_id, result)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
