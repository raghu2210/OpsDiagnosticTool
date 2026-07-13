"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronRight, ExternalLink, RefreshCw } from "lucide-react";
import type { TrackerRow } from "@/lib/domain/types";
import { trackerStatusColor, formatSrNo } from "@/lib/domain/tracker-status";
import { Reveal } from "@/components/motion/Reveal";

function plain(v: string | null | undefined): string {
  const s = (v ?? "").trim();
  return s === "" || s === "-" || s.toLowerCase() === "nan" ? "" : s;
}

interface Block {
  parent: string;
  top: TrackerRow | null;
  children: TrackerRow[];
}

/** Groups tracker rows the way app.py's render_tracker_table() does: a Sr No like "2.1"
 * nests under parent "2", rendered as a single expandable group; rows with no decimal
 * children render as plain flat rows. */
function groupRows(rows: TrackerRow[]): Block[] {
  const order: string[] = [];
  const byParent = new Map<string, TrackerRow[]>();
  for (const row of rows) {
    const srStr = formatSrNo(row.sr_no);
    const parent = srStr.includes(".") ? srStr.split(".")[0] : srStr;
    if (!byParent.has(parent)) {
      byParent.set(parent, []);
      order.push(parent);
    }
    byParent.get(parent)!.push(row);
  }
  return order.map((parent) => {
    const group = byParent.get(parent)!;
    const top = group.find((r) => formatSrNo(r.sr_no) === parent) ?? null;
    const children = group.filter((r) => r !== top);
    return { parent, top, children };
  });
}

function StatusPill({ status }: { status: string }) {
  const s = plain(status);
  if (!s) return null;
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-xs text-xs font-semibold text-white"
      style={{ backgroundColor: trackerStatusColor(s) }}
    >
      {s}
    </span>
  );
}

function TrackerRowCells({ row }: { row: TrackerRow }) {
  const link = plain(row.notes_link);
  return (
    <>
      <td className="font-code text-xs text-neutral px-3 py-2.5 whitespace-nowrap align-top">
        {formatSrNo(row.sr_no)}
      </td>
      <td className="px-3 py-2.5 align-top">{plain(row.project) || "—"}</td>
      <td className="px-3 py-2.5 align-top">{plain(row.actionable) || "—"}</td>
      <td className="px-3 py-2.5 align-top whitespace-nowrap">{plain(row.owner) || "—"}</td>
      <td className="px-3 py-2.5 align-top whitespace-nowrap">
        <StatusPill status={row.status} />
      </td>
      <td className="px-3 py-2.5 align-top">
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-accent hover:underline font-medium"
          >
            Open link <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          plain(row.notes) || "—"
        )}
      </td>
      <td className="px-3 py-2.5 align-top">{plain(row.blocker) || "—"}</td>
    </>
  );
}

const HEAD = ["Sr No", "Project", "Actionable", "Owner", "Status", "Notes / Imp Sheets", "Blocker"];

export function TrackerTable({ initialRows }: { initialRows: TrackerRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const blocks = useMemo(() => groupRows(rows), [rows]);

  async function handleRefresh() {
    setRefreshing(true);
    setRefreshError(null);
    try {
      const resp = await fetch("/api/tracker");
      if (resp.ok) {
        setRows(await resp.json());
      } else {
        setRefreshError("Couldn't refresh the tracker - showing the last loaded data.");
      }
    } catch {
      setRefreshError("Couldn't refresh the tracker - showing the last loaded data.");
    } finally {
      setRefreshing(false);
    }
  }

  function toggleGroup(parent: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      next.has(parent) ? next.delete(parent) : next.add(parent);
      return next;
    });
  }

  if (rows.length === 0) {
    return (
      <div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xs border border-rule hover:border-accent transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
        </button>
        {refreshError && <p className="text-sm text-red mb-3">{refreshError}</p>}
        <p className="text-neutral text-sm">No tracker rows found - check the sheet configuration.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xs border border-rule hover:border-accent transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
        </button>
        {refreshError && <p className="text-sm text-red mt-2">{refreshError}</p>}
      </div>

      <Reveal>
        <div className="overflow-x-auto rounded-sm border border-rule bg-surface shadow-md">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-black/[0.03] border-b border-rule text-left">
                {HEAD.map((h) => (
                  <th key={h} className="font-code font-medium text-xs text-neutral px-3 py-2 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {blocks.map(({ parent, top, children }) => {
                if (children.length === 0) {
                  const row = top!;
                  return (
                    <tr key={parent} className="border-b border-rule last:border-b-0">
                      <TrackerRowCells row={row} />
                    </tr>
                  );
                }
                const open = openGroups.has(parent);
                const headline = top ?? children[0];
                const n = children.length;
                return (
                  <Fragment key={parent}>
                    <tr
                      key={`${parent}-summary`}
                      onClick={() => toggleGroup(parent)}
                      className="border-b border-rule last:border-b-0 cursor-pointer hover:bg-black/[0.02]"
                    >
                      <td className="px-3 py-2.5 align-top">
                        <span className="inline-flex items-center gap-1.5 font-code text-xs text-accent">
                          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-90" : ""}`} />
                          {parent}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 align-top">{plain(headline.project) || "—"}</td>
                      <td className="px-3 py-2.5 align-top">{plain(headline.actionable) || "—"}</td>
                      <td className="px-3 py-2.5 align-top whitespace-nowrap">{plain(headline.owner) || "—"}</td>
                      <td className="px-3 py-2.5 align-top whitespace-nowrap">
                        <StatusPill status={headline.status} />
                      </td>
                      <td className="px-3 py-2.5 align-top text-neutral font-code text-xs" colSpan={2}>
                        +{n} sub-item{n !== 1 ? "s" : ""}
                      </td>
                    </tr>
                    {open &&
                      (top ? [top, ...children] : children).map((child, i) => (
                        <tr key={`${parent}-${i}`} className="border-b border-rule last:border-b-0 bg-black/[0.015]">
                          <TrackerRowCells row={child} />
                        </tr>
                      ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Reveal>
    </div>
  );
}
