import ExcelJS from "exceljs";
import type { ScoreValue, SubpointScore } from "@/lib/domain/types";

/**
 * Ported from app.py's parse_uploaded_checklist(): reads the "Checklist" sheet produced by
 * this tool's own export (row 1 title, row 2 blank, row 3 headers, row 4+ data), finds the
 * subpoint_id column plus whichever column starts with "score (" / "observation" (case
 * -insensitive, matching the Python `.lower().startswith(...)` lookup rather than an exact
 * header match), and returns only rows with a valid 1-5 score - same net result as the
 * Python version's two-stage filter (parse, then `between(1, 5)` at diagnostic time).
 */
export async function parseChecklistXlsx(buffer: ArrayBuffer): Promise<SubpointScore[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.getWorksheet("Checklist");
  if (!ws) {
    throw new Error("Couldn't find a 'Checklist' sheet - make sure it's a checklist exported by this tool.");
  }

  const headers: string[] = [];
  ws.getRow(3).eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber] = String(cell.value ?? "").trim();
  });

  const findCol = (predicate: (lower: string) => boolean) =>
    headers.findIndex((h) => predicate((h ?? "").toLowerCase()));

  const subpointCol = findCol((h) => h === "subpoint_id");
  const scoreCol = findCol((h) => h.startsWith("score ("));
  const obsCol = findCol((h) => h.startsWith("observation"));

  if (subpointCol === -1) {
    throw new Error("Couldn't find a subpoint_id column - make sure it's a checklist exported by this tool.");
  }

  const out: SubpointScore[] = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber <= 3) return; // title, blank, header rows
    const subpointId = row.getCell(subpointCol).value;
    if (subpointId === null || subpointId === undefined || subpointId === "") return;

    const rawScore = scoreCol !== -1 ? row.getCell(scoreCol).value : null;
    const score = typeof rawScore === "number" ? rawScore : Number(rawScore);
    if (!(score >= 1 && score <= 5)) return;

    const observation = obsCol !== -1 ? String(row.getCell(obsCol).value ?? "").trim() : "";
    out.push({ subpoint_id: String(subpointId).trim(), score: score as ScoreValue, observation });
  });
  return out;
}
