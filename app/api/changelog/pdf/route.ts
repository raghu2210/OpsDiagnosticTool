import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { ChangelogReport } from "@/lib/pdf/ChangelogReport";
import { APP_VERSION, APP_UPDATED, CHANGELOG } from "@/lib/domain/workflow-content";

// @react-pdf/renderer needs Node APIs (fs for local image reads) - not compatible with
// the Edge runtime.
export const runtime = "nodejs";

export async function GET() {
  const buffer = await renderToBuffer(
    ChangelogReport({ version: APP_VERSION, updated: APP_UPDATED, changelog: CHANGELOG })
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="LongArc_Workflow_Changelog_v${APP_VERSION}.pdf"`,
    },
  });
}
