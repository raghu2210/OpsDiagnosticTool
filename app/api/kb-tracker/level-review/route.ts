import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import type { KbTrackerRow, MasterRow } from "@/lib/domain/types";
import { deriveReviewStatus, parseLevelReview, patchLevelReview, serializeLevelReview } from "@/lib/domain/level-review";
import { KB_TRACKER_FALLBACK_PATH, MASTERS_FALLBACK_PATH } from "@/lib/data/masters-source";
import { getGoogleAuthClient } from "@/lib/data/google-auth";

interface LevelReviewRequest {
  subpoint_id: string;
  level: number;
  approved?: boolean;
  comment?: string;
}

const XLSX_PATH = path.join(process.cwd(), "sample_data/KB_Updated.xlsx");
const MASTER_SUBPOINT_ID_COL = 6; // Master sheet: F
const MASTER_LEVEL_REVIEW_COL = 16; // Master sheet: P (inserted after O="status")
const SHEET1_SUBPOINT_ID_COL = 4; // Sheet1: D
const SHEET1_REVIEW_STATUS_COL = 6; // Sheet1: F

/** Finds the 1-indexed row number of the first row (below the header) whose given
 * column matches `value`, by reading that whole column in one call. */
async function findRowNumber(
  sheets: ReturnType<typeof google.sheets>,
  sheetId: string,
  tab: string,
  colLetter: string,
  value: string
): Promise<number | null> {
  const resp = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: `${tab}!${colLetter}:${colLetter}` });
  const rows = resp.data.values ?? [];
  const idx = rows.findIndex((r, i) => i > 0 && String(r[0] ?? "").trim() === value);
  return idx === -1 ? null : idx + 1;
}

/** Writes the approval directly to the live Google Sheet (Master!level_review,
 * Sheet1!review_status) so it's visible from the deployed (Vercel) app, which can't
 * write to local files. Mirrors the xlsx column layout in updateXlsx() below 1:1. */
async function updateGoogleSheet(sheetId: string, subpointId: string, level: 1 | 2 | 3 | 4 | 5, patch: { approved?: boolean; comment?: string }) {
  const auth = getGoogleAuthClient({ write: true });
  if (!auth) return null;
  const sheets = google.sheets({ version: "v4", auth });

  const masterRowNum = await findRowNumber(sheets, sheetId, "Master", "F", subpointId);
  if (!masterRowNum) return null;

  const current = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: `Master!P${masterRowNum}` });
  const entries = parseLevelReview(String(current.data.values?.[0]?.[0] ?? ""));
  const patched = patchLevelReview(entries, level, patch);
  const serialized = serializeLevelReview(patched);

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `Master!P${masterRowNum}`,
    valueInputOption: "RAW",
    requestBody: { values: [[serialized]] },
  });

  const newStatus = deriveReviewStatus(patched);
  const sheet1RowNum = await findRowNumber(sheets, sheetId, "Sheet1", "D", subpointId);
  if (sheet1RowNum) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `Sheet1!F${sheet1RowNum}`,
      valueInputOption: "RAW",
      requestBody: { values: [[newStatus]] },
    });
  }

  return { serialized, newStatus };
}

/**
 * Persists a reviewer's approval tick / comment on ONE maturity level (1-5) of one KB
 * Tracker sub-point. When GOOGLE_SHEET_ID + service-account credentials are configured,
 * writes straight to the live Google Sheet (Master!level_review, Sheet1!review_status) via
 * updateGoogleSheet() above, so it works from the deployed app where the filesystem is
 * read-only. Otherwise (local dev without those env vars) falls back to editing the local
 * sample_data/KB_Updated.xlsx workbook directly:
 * - Master sheet column P ("level_review") - all 5 levels' state for that sub-point,
 *   encoded as one line per level (see lib/domain/level-review.ts). Column O ("status") is
 *   Master's unrelated active/inactive scoring flag - never touched here.
 * - Sheet1 column F ("review_status") - the status derived from the 5 levels, mirrored
 *   here so the KB Tracker page's existing area/status grouping (which reads
 *   KbTrackerRow.review_status) updates without any UI logic changes.
 * Either way, also patches lib/data/local-fallback/masters.json and kb-tracker.json, so
 * both are visible immediately without re-running scripts/generate-fallback-json.mjs or
 * restarting.
 */
export async function POST(request: NextRequest) {
  const body: LevelReviewRequest = await request.json();
  const subpointId = body.subpoint_id?.trim();
  const level = body.level;
  if (!subpointId) return NextResponse.json({ error: "subpoint_id is required" }, { status: 400 });
  if (![1, 2, 3, 4, 5].includes(level)) return NextResponse.json({ error: "level must be 1-5" }, { status: 400 });
  if (body.approved === undefined && body.comment === undefined) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const patch: { approved?: boolean; comment?: string } = {};
  if (body.approved !== undefined) patch.approved = body.approved;
  if (body.comment !== undefined) patch.comment = body.comment;

  const sheetId = process.env.GOOGLE_SHEET_ID;
  let serialized: string;
  let newStatus: string;

  if (sheetId) {
    const result = await updateGoogleSheet(sheetId, subpointId, level as 1 | 2 | 3 | 4 | 5, patch);
    if (!result) return NextResponse.json({ error: `subpoint_id "${subpointId}" not found in Google Sheet, or credentials not configured` }, { status: 404 });
    serialized = result.serialized;
    newStatus = result.newStatus;
  } else {
    const fallback = await updateXlsx(subpointId, level as 1 | 2 | 3 | 4 | 5, patch);
    if ("error" in fallback) return NextResponse.json({ error: fallback.error }, { status: fallback.status });
    serialized = fallback.serialized;
    newStatus = fallback.newStatus;
  }

  const masters: MasterRow[] = JSON.parse(readFileSync(MASTERS_FALLBACK_PATH, "utf-8"));
  const masterTarget = masters.find((r) => r.subpoint_id === subpointId);
  if (masterTarget) {
    masterTarget.level_review = serialized;
    writeFileSync(MASTERS_FALLBACK_PATH, JSON.stringify(masters, null, 2));
  }

  const kbRows: KbTrackerRow[] = JSON.parse(readFileSync(KB_TRACKER_FALLBACK_PATH, "utf-8"));
  const kbTarget = kbRows.find((r) => r.subpoint_id === subpointId);
  if (kbTarget) {
    kbTarget.review_status = newStatus;
    writeFileSync(KB_TRACKER_FALLBACK_PATH, JSON.stringify(kbRows, null, 2));
  }

  return NextResponse.json({ ok: true, subpoint_id: subpointId, level_review: serialized, review_status: newStatus });
}

type UpdateResult = { serialized: string; newStatus: string };
type UpdateError = { error: string; status: number };

async function updateXlsx(subpointId: string, level: 1 | 2 | 3 | 4 | 5, patch: { approved?: boolean; comment?: string }): Promise<UpdateResult | UpdateError> {
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.readFile(XLSX_PATH);
  } catch {
    return { error: "Couldn't open KB_Updated.xlsx", status: 500 };
  }

  const master = wb.getWorksheet("Master");
  if (!master) return { error: "Master sheet not found in workbook", status: 500 };

  let masterRow: ExcelJS.Row | undefined;
  master.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    if (String(row.getCell(MASTER_SUBPOINT_ID_COL).value ?? "").trim() === subpointId) masterRow = row;
  });
  if (!masterRow) return { error: `subpoint_id "${subpointId}" not found in Master`, status: 404 };

  const entries = parseLevelReview(String(masterRow.getCell(MASTER_LEVEL_REVIEW_COL).value ?? ""));
  const patched = patchLevelReview(entries, level, patch);
  const serialized = serializeLevelReview(patched);
  masterRow.getCell(MASTER_LEVEL_REVIEW_COL).value = serialized;

  const newStatus = deriveReviewStatus(patched);

  const sheet1 = wb.getWorksheet("Sheet1");
  if (sheet1) {
    sheet1.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      if (String(row.getCell(SHEET1_SUBPOINT_ID_COL).value ?? "").trim() === subpointId) {
        row.getCell(SHEET1_REVIEW_STATUS_COL).value = newStatus;
      }
    });
  }

  try {
    await wb.xlsx.writeFile(XLSX_PATH);
  } catch {
    return { error: "Couldn't save KB_Updated.xlsx - is it open in Excel?", status: 409 };
  }

  return { serialized, newStatus };
}
