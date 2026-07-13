import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { WorkflowReport } from "@/lib/pdf/WorkflowReport";
import { loadMasters, loadRecommendations } from "@/lib/data/masters-source";
import { APP_VERSION, APP_UPDATED, FLOW_STEPS, WORKFLOW_SECTIONS } from "@/lib/domain/workflow-content";

// @react-pdf/renderer needs Node APIs (fs for local image reads) - not compatible with
// the Edge runtime.
export const runtime = "nodejs";

export async function GET() {
  const [masters, recommendations] = await Promise.all([loadMasters(), loadRecommendations()]);
  const active = masters.filter((r) => r.status === "active");

  const stats = {
    nModules: new Set(active.map((r) => r.module_id)).size,
    nAreas: new Set(active.map((r) => `${r.module_id}::${r.area_id}`)).size,
    nPoints: active.length,
    nRecos: recommendations.length,
  };

  const buffer = await renderToBuffer(
    WorkflowReport({
      version: APP_VERSION,
      updated: APP_UPDATED,
      stats,
      flowSteps: FLOW_STEPS,
      sections: WORKFLOW_SECTIONS,
    })
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="LongArc_Workflow_v${APP_VERSION}.pdf"`,
    },
  });
}
