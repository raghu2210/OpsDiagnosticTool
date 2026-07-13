import ExcelJS from "exceljs";
import type { MasterRow } from "@/lib/domain/types";

const SCORE_COLS = ["score_1_desc", "score_2_desc", "score_3_desc", "score_4_desc", "score_5_desc"] as const;

const HEADERS = [
  "area_id",
  "area_name",
  "subpoint_id",
  "subpoint_name",
  "subpoint_weight",
  "score_1_desc",
  "score_2_desc",
  "score_3_desc",
  "score_4_desc",
  "score_5_desc",
  "Score (1-5)",
  "Observation",
] as const;

const COLUMN_WIDTHS = [8, 16, 11, 24, 12, 22, 22, 22, 22, 22, 11, 30];

/**
 * Ported from app.py's build_checklist_excel(): a fillable audit workbook, one row per
 * sub-point, with blank Score/Observation columns for the auditor to fill on the ground.
 */
export async function buildChecklistXlsx(
  moduleName: string,
  areaRows: MasterRow[],
  areaName?: string
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
  ws.mergeCells("A1:L1");
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

  for (const row of areaRows) {
    const vals: (string | number)[] = [
      row.area_id ?? "",
      row.area_name ?? "",
      row.subpoint_id ?? "",
      row.subpoint_name ?? "",
      row.subpoint_weight ?? "",
      ...SCORE_COLS.map((c) => row[c] ?? ""),
      "",
      "",
    ];
    const dataRow = ws.addRow(vals);
    dataRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = bodyFont;
      cell.alignment = wrapTop;
      cell.border = border;
    });
  }

  ws.columns.forEach((col, i) => {
    col.width = COLUMN_WIDTHS[i];
  });

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
