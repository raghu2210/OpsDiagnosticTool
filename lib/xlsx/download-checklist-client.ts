import type { MasterRow, ProblemRow } from "@/lib/domain/types";

/** Client-side helper: POSTs to /api/checklist/export and triggers a browser download of
 * the resulting .xlsx. Shared by every place that offers a checklist export (Diagnose's
 * "Score in-app" tab) - previously duplicated inside BuildFlow.tsx before the standalone
 * Build a Checklist page was folded into Diagnose. */
export async function downloadChecklist(
  moduleName: string,
  rows: MasterRow[],
  areaName: string | undefined,
  fileName: string,
  problems: ProblemRow[]
) {
  const resp = await fetch("/api/checklist/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ moduleName, rows, areaName, problems }),
  });
  if (!resp.ok) throw new Error("Failed to generate checklist");
  const blob = await resp.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
