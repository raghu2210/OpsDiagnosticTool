// One-off script: converts sample_data/KB_Updated.xlsx into checked-in JSON
// (lib/data/local-fallback/{masters,recommendations,problems}.json) so the app doesn't need to
// parse xlsx on every request when Google Sheets isn't configured. Not part of the
// Next.js build - run manually with `node scripts/generate-fallback-json.mjs` whenever
// sample_data/KB_Updated.xlsx changes. Reads a "Master" sheet (singular) -
// this workbook replaced the old LongArc_Masters.xlsx ("Masters", plural) as of v3.5.
//
// As of the KB_Updated.xlsx revision, Master gained benchmarking columns (R onward:
// process step, KPI, Zepto/Blinkit/Instamart/FC ratings) that the app doesn't use yet -
// only columns A-Q are read: A-O are the original fields, P is "level_review" (reviewer
// approval/comment per maturity level 1-5, inserted after O - see
// lib/domain/level-review.ts), Q is indicative_scoring_questions (shifted right by the
// level_review insert). KB Tracker data lives in a sheet named "Sheet1" (same
// module_id/area_id/area_name/subpoint_id/subpoint_name/review_status schema as before,
// just renamed) - only columns A-F are read; review_status is now Master-derived and
// written by /api/kb-tracker/level-review, and former columns G/H ("approved"/"comment"
// from a superseded per-sub-point design) were cleared and are no longer read.
//
// normalizeDashes() is duplicated here (plain JS, not imported from lib/domain/normalize.ts)
// since this script runs outside Next.js's TS transpilation - keep both in sync if the
// dash-normalization regex ever changes.
import ExcelJS from "exceljs";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_XLSX = path.resolve(__dirname, "../sample_data/KB_Updated.xlsx");
const OUT_DIR = path.resolve(__dirname, "../lib/data/local-fallback");

const DASH_RE = /[‐‑‒–—―−﹘﹣－⁃]/g;

function normalizeDashes(value) {
  return typeof value === "string" ? value.replace(DASH_RE, "-") : value;
}

function sheetToRecords(worksheet, maxCol) {
  const rows = [];
  let headers = [];
  worksheet.eachRow((row, rowNumber) => {
    let values = row.values.slice(1); // exceljs rows are 1-indexed with a leading empty slot
    if (maxCol) values = values.slice(0, maxCol);
    if (rowNumber === 1) {
      headers = values.map((v) => String(v ?? "").trim());
      return;
    }
    const record = {};
    headers.forEach((key, i) => {
      let cell = values[i];
      if (cell && typeof cell === "object" && "result" in cell) cell = cell.result; // formula cells
      record[key] = normalizeDashes(cell ?? "");
    });
    rows.push(record);
  });
  return rows;
}

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(SOURCE_XLSX);

  const masters = sheetToRecords(wb.getWorksheet("Master"), 17); // A-Q only
  const recommendations = sheetToRecords(wb.getWorksheet("Recommendations"));
  const problemsWs = wb.getWorksheet("Problems");
  const problems = problemsWs ? sheetToRecords(problemsWs) : [];
  // KB Tracker: content review status (Closed/Needs review/Pending) per sub-point - a
  // separate dataset from Master, same principle as the Sync Tracker page keeping its
  // data wholly apart from Masters/Recommendations. Optional sheet, defaults to [].
  const kbTrackerWs = wb.getWorksheet("Sheet1");
  const kbTracker = kbTrackerWs ? sheetToRecords(kbTrackerWs, 6) : []; // A-F only - G/H are cleared, I onward is an unrelated live-query mirror

  writeFileSync(path.join(OUT_DIR, "masters.json"), JSON.stringify(masters, null, 2));
  writeFileSync(path.join(OUT_DIR, "recommendations.json"), JSON.stringify(recommendations, null, 2));
  writeFileSync(path.join(OUT_DIR, "problems.json"), JSON.stringify(problems, null, 2));
  writeFileSync(path.join(OUT_DIR, "kb-tracker.json"), JSON.stringify(kbTracker, null, 2));

  console.log(
    `Wrote ${masters.length} Masters rows, ${recommendations.length} Recommendations rows, ${problems.length} Problems rows, ${kbTracker.length} KB Tracker rows to ${OUT_DIR}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
