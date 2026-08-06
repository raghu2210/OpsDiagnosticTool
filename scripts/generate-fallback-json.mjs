// One-off script: converts sample_data/LongArc_Masters.xlsx into checked-in JSON
// (lib/data/local-fallback/{masters,recommendations,problems}.json) so the app doesn't need to
// parse xlsx on every request when Google Sheets isn't configured. Not part of the
// Next.js build - run manually with `node scripts/generate-fallback-json.mjs` whenever
// sample_data/LongArc_Masters.xlsx changes.
//
// normalizeDashes() is duplicated here (plain JS, not imported from lib/domain/normalize.ts)
// since this script runs outside Next.js's TS transpilation - keep both in sync if the
// dash-normalization regex ever changes.
import ExcelJS from "exceljs";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_XLSX = path.resolve(__dirname, "../sample_data/Knowledge_base_updated.xlsx");
const OUT_DIR = path.resolve(__dirname, "../lib/data/local-fallback");

const DASH_RE = /[‐‑‒–—―−﹘﹣－⁃]/g;

function normalizeDashes(value) {
  return typeof value === "string" ? value.replace(DASH_RE, "-") : value;
}

function sheetToRecords(worksheet) {
  const rows = [];
  let headers = [];
  worksheet.eachRow((row, rowNumber) => {
    const values = row.values.slice(1); // exceljs rows are 1-indexed with a leading empty slot
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

  const masters = sheetToRecords(wb.getWorksheet("Master"));
  const recommendations = sheetToRecords(wb.getWorksheet("Recommendations"));
  const problemsWs = wb.getWorksheet("Problems");
  const problems = problemsWs ? sheetToRecords(problemsWs) : [];

  writeFileSync(path.join(OUT_DIR, "masters.json"), JSON.stringify(masters, null, 2));
  writeFileSync(path.join(OUT_DIR, "recommendations.json"), JSON.stringify(recommendations, null, 2));
  writeFileSync(path.join(OUT_DIR, "problems.json"), JSON.stringify(problems, null, 2));

  console.log(
    `Wrote ${masters.length} Masters rows, ${recommendations.length} Recommendations rows, ${problems.length} Problems rows to ${OUT_DIR}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
