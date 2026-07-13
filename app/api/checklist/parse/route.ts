import { NextRequest, NextResponse } from "next/server";
import { parseChecklistXlsx } from "@/lib/xlsx/parse-checklist";

// exceljs needs Node APIs - not compatible with the Edge runtime.
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }
  try {
    const rows = await parseChecklistXlsx(await file.arrayBuffer());
    return NextResponse.json(rows);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to parse the uploaded file";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
