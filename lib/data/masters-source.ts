import { google } from "googleapis";
import { getGoogleAuthClient } from "./google-auth";
import { normalizeDashesDeep } from "@/lib/domain/normalize";
import type { MasterRow, ProblemRow, RecommendationRow } from "@/lib/domain/types";
import masterFallback from "./local-fallback/masters.json";
import recommendationFallback from "./local-fallback/recommendations.json";
import problemFallback from "./local-fallback/problems.json";

/** Converts a Sheets values.get response (array of row arrays, first row = headers)
 * into an array of plain objects keyed by header - mirrors gspread's get_all_records(). */
function rowsToRecords(rows: unknown[][]): Record<string, unknown>[] {
  if (!rows.length) return [];
  const [header, ...data] = rows as string[][];
  return data.map((row) => {
    const record: Record<string, unknown> = {};
    header.forEach((key, i) => {
      record[key] = row[i] ?? "";
    });
    return record;
  });
}

async function fetchSheetRange(sheetId: string, range: string): Promise<Record<string, unknown>[]> {
  const auth = getGoogleAuthClient();
  if (!auth) throw new Error("Google service account not configured");
  const sheets = google.sheets({ version: "v4", auth });
  const resp = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range });
  return rowsToRecords((resp.data.values ?? []) as unknown[][]);
}

/**
 * Reads the Masters sheet. Uses Google Sheets (service account) if GOOGLE_SHEET_ID +
 * credentials are configured; otherwise falls back to the bundled local JSON so the app
 * runs without any setup - same graceful-degradation contract as app.py's load_masters().
 * Returns ALL rows (including inactive) - callers filter status === "active" themselves,
 * matching the Python routing code's `masters = masters[masters["status"] == "active"]`.
 */
export async function loadMasters(): Promise<MasterRow[]> {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (sheetId) {
    try {
      const rows = await fetchSheetRange(sheetId, "Masters");
      return normalizeDashesDeep(rows) as unknown as MasterRow[];
    } catch {
      // fall through to local fallback, same as the Python try/except
    }
  }
  return masterFallback as unknown as MasterRow[];
}

/** Reads the editable Recommendations sheet. Gracefully returns [] if missing/empty,
 * mirroring app.py's load_recommendations(). */
export async function loadRecommendations(): Promise<RecommendationRow[]> {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (sheetId) {
    try {
      const rows = await fetchSheetRange(sheetId, "Recommendations");
      return normalizeDashesDeep(rows) as unknown as RecommendationRow[];
    } catch {
      // fall through to local fallback
    }
  }
  return recommendationFallback as unknown as RecommendationRow[];
}

/**
 * Reads the Problems sheet - Node 4 of the diagnostic tree (leaf-level scoring for
 * sub-points broken down this granularly). Gracefully returns [] if the sheet is
 * missing/empty (e.g. a Google Sheet that predates this feature), same
 * graceful-degradation contract as loadRecommendations(). Purely additive: sub-points
 * with no Problems rows are unaffected and score directly, exactly as before.
 */
export async function loadProblems(): Promise<ProblemRow[]> {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (sheetId) {
    try {
      const rows = await fetchSheetRange(sheetId, "Problems");
      return normalizeDashesDeep(rows) as unknown as ProblemRow[];
    } catch {
      // fall through to local fallback
    }
  }
  return problemFallback as unknown as ProblemRow[];
}
