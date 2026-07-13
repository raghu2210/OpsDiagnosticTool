import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { DiagnosticReport } from "@/lib/pdf/DiagnosticReport";
import type { DiagnosticResult } from "@/lib/domain/types";

// @react-pdf/renderer needs Node APIs (fs for local image reads) - not compatible with
// the Edge runtime.
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { moduleName, diag }: { moduleName: string; diag: DiagnosticResult } = await request.json();
  const buffer = await renderToBuffer(DiagnosticReport({ moduleName, diag }));
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="diagnostic.pdf"`,
    },
  });
}
