import ExcelJS from "exceljs";
import type { MasterRow, ProblemRow } from "@/lib/domain/types";

const SCORE_COLS = ["score_1_desc", "score_2_desc", "score_3_desc", "score_4_desc", "score_5_desc"] as const;

const HEADERS = [
  "area_id",
  "area_name",
  "subpoint_id",
  "subpoint_name",
  "problem_id",
  "problem_name",
  "weight",
  "score_1_desc",
  "score_2_desc",
  "score_3_desc",
  "score_4_desc",
  "score_5_desc",
  "Score (1-5)",
  "Observation",
] as const;

const COLUMN_WIDTHS = [8, 16, 11, 24, 10, 24, 9, 22, 22, 22, 22, 22, 11, 30];

/**
 * Ported from app.py's build_checklist_excel(): a fillable audit workbook, blank Score/
 * Observation columns for the auditor to fill on the ground. Node-4-aware: a sub-point
 * with rows in `problems` emits one row per problem statement (problem_id/problem_name
 * populated, weight/descriptions are the problem's own) instead of one row for the
 * sub-point itself - keeping the offline checklist in sync with what "Score in-app"
 * shows, so an auditor filling this out on paper and one scoring live in the app produce
 * the same shape of data. Sub-points with no problems (every area but the current pilot)
 * emit exactly the row they always have.
 */
export async function buildChecklistXlsx(
  moduleName: string,
  areaRows: MasterRow[],
  areaName?: string,
  problems: ProblemRow[] = []
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Checklist");

  const headerFill: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF3A3A3A" },
  };
  const headerFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FFFFFFFF" }, name: "Arial", size: 10 };
  const bodyFont: Partial<ExcelJS.Font> = { name: "Arial", size: 10 };
  const wrapTop: Partial<ExcelJS.Alignment> = { wrapText: true, vertical: "top" };
  const thin: Partial<ExcelJS.Border> = { style: "thin", color: { argb: "FFD9D9D9" } };
  const border: Partial<ExcelJS.Borders> = { left: thin, right: thin, top: thin, bottom: thin };

  const title = `${moduleName}${areaName ? ` - ${areaName}` : " - Full Checklist"}`;
  ws.mergeCells("A1:N1");
  ws.getCell("A1").value = title;
  ws.getCell("A1").font = { bold: true, size: 13, name: "Arial" };

  ws.addRow([]); // spacer row 2
  const headerRow = ws.addRow([...HEADERS]); // row 3
  headerRow.eachCell((cell) => {
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = border;
  });

  const problemsBySubpoint = new Map<string, ProblemRow[]>();
  for (const p of problems) {
    const list = problemsBySubpoint.get(p.subpoint_id) ?? [];
    list.push(p);
    problemsBySubpoint.set(p.subpoint_id, list);
  }

  function addDataRow(vals: (string | number)[]) {
    const dataRow = ws.addRow(vals);
    dataRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = bodyFont;
      cell.alignment = wrapTop;
      cell.border = border;
    });
  }

  for (const row of areaRows) {
    const subProblems = problemsBySubpoint.get(row.subpoint_id);
    if (subProblems && subProblems.length > 0) {
      for (const p of subProblems) {
        addDataRow([
          row.area_id ?? "",
          row.area_name ?? "",
          row.subpoint_id ?? "",
          row.subpoint_name ?? "",
          p.problem_id,
          p.problem_name,
          p.problem_weight,
          ...SCORE_COLS.map((c) => p[c] ?? ""),
          "",
          "",
        ]);
      }
      continue;
    }
    addDataRow([
      row.area_id ?? "",
      row.area_name ?? "",
      row.subpoint_id ?? "",
      row.subpoint_name ?? "",
      "",
      "",
      row.subpoint_weight ?? "",
      ...SCORE_COLS.map((c) => row[c] ?? ""),
      "",
      "",
    ]);
  }

  ws.columns.forEach((col, i) => {
    col.width = COLUMN_WIDTHS[i];
  });

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
