import { COLOR } from "@/styles/tokens";

/** Ported 1:1 from app.py's _tracker_status_style() - maps a free-text Sync Tracker
 * status cell onto the shared semantic palette (same colors as the score bands, reused
 * for a different meaning here: process state rather than maturity). */
export function trackerStatusColor(status: string): string {
  const s = (status || "").trim().toLowerCase();
  if (s.includes("block")) return COLOR.red;
  if (s.includes("complete") || s.includes("closed") || s.includes("done")) return COLOR.green;
  if (s.includes("cancel") || s.includes("hold") || s === "to start" || s.includes("planning")) return COLOR.neutral;
  if (s.includes("progress") || s.includes("execution")) return COLOR.blue;
  if (
    s.includes("review") ||
    s.includes("await") ||
    s.includes("pending") ||
    s.includes("ongoing") ||
    s.includes("finalization")
  )
    return COLOR.amber;
  return COLOR.charcoal;
}

/** Formats a Sr No value the way app.py's _fmt_sr() does: numeric values drop trailing
 * zeros (2.0 -> "2", 2.10 -> "2.1"), non-numeric values pass through trimmed. */
export function formatSrNo(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === "") return "";
  const f = typeof v === "number" ? v : Number(v);
  if (!Number.isNaN(f)) {
    return String(f);
  }
  return String(v).trim();
}
