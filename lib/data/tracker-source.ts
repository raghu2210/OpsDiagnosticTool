import Papa from "papaparse";
import { google } from "googleapis";
import { getGoogleAuthClient } from "./google-auth";
import { normalizeDashesDeep } from "@/lib/domain/normalize";
import { linkify } from "@/lib/domain/normalize";
import type { TrackerRow } from "@/lib/domain/types";

// Same default sheet ID app.py falls back to when no override is configured - kept as a
// plain constant (not a secret) since it's a read-only public tracker mirror.
const DEFAULT_TRACKER_SHEET_ID = "1FyZ62VW5P5sLrxsfLJ7UYGOuOVHm8wS1IluLcPhX-iA";
const TRACKER_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRIg853XOe4HYNrZArtWaP9WDM_jADi14OY3fYoLcyQpE4duuihH6315zcMmUeV8glrUzoFpKWtS1R6/pub?gid=0&single=true&output=csv";

interface SheetCellData {
  formattedValue?: string | null;
  hyperlink?: string | null;
}
interface SheetRowData {
  values?: SheetCellData[] | null;
}

/**
 * Reads the manually-maintained Sync Tracker sheet. Uses the Sheets API (which preserves
 * rich-text hyperlinks) when GOOGLE_TRACKER_SHEET_ID + service-account credentials are
 * configured; otherwise falls back to the sheet's live published CSV (no auth needed, but
 * Google's CSV export drops hyperlinks - a bare URL pasted directly into a cell is still
 * auto-linkified via `linkify()`). Mirrors app.py's load_tracker() try/except fallback.
 */
export async function loadTracker(): Promise<TrackerRow[]> {
  const sheetId = process.env.GOOGLE_TRACKER_SHEET_ID || DEFAULT_TRACKER_SHEET_ID;
  const auth = getGoogleAuthClient();
  if (auth) {
    try {
      const sheets = google.sheets({ version: "v4", auth });
      const resp = await sheets.spreadsheets.get({
        spreadsheetId: sheetId,
        ranges: ["Tracker"],
        fields: "sheets.data.rowData.values(formattedValue,hyperlink)",
      });
      const rowData: SheetRowData[] = resp.data.sheets?.[0]?.data?.[0]?.rowData ?? [];
      const rows: TrackerRow[] = [];
      for (const r of rowData.slice(1)) {
        const cells = r.values ?? [];
        const val = (i: number) => cells[i]?.formattedValue ?? "";
        const link = (i: number) => cells[i]?.hyperlink ?? null;
        if (!val(0)) continue;
        const notes = val(5);
        rows.push({
          sr_no: val(0),
          project: val(1),
          actionable: val(2),
          owner: val(3),
          status: val(4),
          notes,
          notes_link: link(5) || linkify(notes),
          blocker: val(6),
        });
      }
      return normalizeDashesDeep(rows) as TrackerRow[];
    } catch {
      // fall through to the published-CSV fallback, same as the Python try/except
    }
  }

  try {
    const resp = await fetch(TRACKER_CSV_URL);
    if (!resp.ok) return [];
    const text = await resp.text();
    const { data } = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
    const normalizeKey = (k: string) => k.trim().toLowerCase().replace(" / imp sheets", "").replace(/ /g, "_");
    const rows: TrackerRow[] = data
      .map((raw) => {
        const record: Record<string, string> = {};
        for (const [k, v] of Object.entries(raw)) record[normalizeKey(k)] = v ?? "";
        return record;
      })
      .filter((r) => (r.sr_no ?? "").trim() !== "")
      .map((r) => ({
        sr_no: r.sr_no ?? "",
        project: r.project ?? "",
        actionable: r.actionable ?? "",
        owner: r.owner ?? "",
        status: r.status ?? "",
        notes: r.notes ?? "",
        notes_link: linkify(r.notes ?? ""),
        blocker: r.blocker ?? "",
      }));
    return normalizeDashesDeep(rows) as TrackerRow[];
  } catch {
    return [];
  }
}
