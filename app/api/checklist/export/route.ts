import { NextRequest, NextResponse } from "next/server";
import { buildChecklistXlsx } from "@/lib/xlsx/build-checklist";
import type { MasterRow, ProblemRow } from "@/lib/domain/types";

export async function POST(request: NextRequest) {
  const {
    moduleName,
    rows,
    areaName,
    problems,
  }: { moduleName: string; rows: MasterRow[]; areaName?: string; problems?: ProblemRow[] } = await request.json();
  const buffer = await buildChecklistXlsx(moduleName, rows, areaName, problems);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="checklist.xlsx"`,
    },
  });
}
