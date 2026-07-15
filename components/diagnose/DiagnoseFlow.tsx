"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import type { MasterRow, ProblemRow, RecommendationRow, DiagnosticResult, SubpointScore } from "@/lib/domain/types";
import { groupByArea, listModules } from "@/lib/domain/grouping";
import { computeDiagnostic, toScoreMaps } from "@/lib/domain/scoring";
import { ScoreForm, type ScoreFormValues } from "./ScoreForm";
import { UploadChecklist } from "./UploadChecklist";
import { ResultsReveal } from "./ResultsReveal";

type InputMode = "upload" | "form";

export function DiagnoseFlow({
  masters,
  recommendations,
  problems,
  initialModuleId,
}: {
  masters: MasterRow[];
  recommendations: RecommendationRow[];
  problems: ProblemRow[];
  initialModuleId?: string;
}) {
  const modules = useMemo(() => listModules(masters), [masters]);
  const [moduleId, setModuleId] = useState(
    initialModuleId && modules.some((m) => m.module_id === initialModuleId) ? initialModuleId : modules[0]?.module_id
  );
  const [mode, setMode] = useState<InputMode>("upload");
  const [diag, setDiag] = useState<DiagnosticResult | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const moduleRows = useMemo(() => masters.filter((r) => r.module_id === moduleId), [masters, moduleId]);
  const moduleProblems = useMemo(() => problems.filter((r) => r.module_id === moduleId), [problems, moduleId]);
  const areas = useMemo(() => groupByArea(moduleRows), [moduleRows]);
  const moduleName = moduleRows[0]?.module_name ?? "";

  function handleModuleChange(newId: string) {
    setModuleId(newId);
    setDiag(null);
  }

  function handleSubmit(values: ScoreFormValues) {
    setDiag(
      computeDiagnostic(
        moduleRows,
        values.scores,
        values.observations,
        recommendations,
        values.photos,
        moduleProblems,
        values.problemScores
      )
    );
  }

  function handleUploaded(rows: SubpointScore[]) {
    const { scores, problemScores, observations } = toScoreMaps(rows);
    setDiag(
      computeDiagnostic(moduleRows, scores, observations, recommendations, undefined, moduleProblems, problemScores)
    );
  }

  async function handleDownloadPdf() {
    if (!diag) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      const resp = await fetch("/api/diagnostic/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleName, diag }),
      });
      if (!resp.ok) throw new Error("Failed to generate PDF");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${moduleId}_diagnostic.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setDownloadError(e instanceof Error ? e.message : "Couldn't generate that PDF. Try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <label className="text-sm font-medium block mb-1.5" htmlFor="module-select">
          Select a Module
        </label>
        <select
          id="module-select"
          className="border border-rule rounded-xs px-3 py-2 text-sm min-w-72 focus:outline-none focus:border-accent"
          value={moduleId}
          onChange={(e) => handleModuleChange(e.target.value)}
        >
          {modules.map((m) => (
            <option key={m.module_id} value={m.module_id}>
              {m.module_id} &ndash; {m.module_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="flex gap-1 border-b border-rule mb-6">
          {(
            [
              ["upload", "Upload filled checklist"],
              ["form", "Score in-app"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`text-sm font-medium px-4 py-2.5 border-b-2 -mb-px transition-colors ${
                mode === key ? "border-accent text-ink" : "border-transparent text-neutral hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === "upload" ? (
          <UploadChecklist key={moduleId} onParsed={handleUploaded} />
        ) : (
          <ScoreForm key={moduleId} areas={areas} problems={moduleProblems} onSubmit={handleSubmit} />
        )}
      </div>

      {diag && (
        <div className="pt-8 border-t border-rule">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold">Diagnostic</h2>
              {diag.n_scored > 0 && (
                <button
                  onClick={handleDownloadPdf}
                  disabled={downloading}
                  className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xs bg-charcoal text-white hover:bg-ink transition-colors disabled:opacity-50"
                >
                  {downloading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {downloading ? "Generating..." : "Download PDF diagnostic"}
                </button>
              )}
            </div>
            {downloadError && <p className="text-sm text-red text-right mt-2">{downloadError}</p>}
          </div>
          <ResultsReveal diag={diag} />
        </div>
      )}
    </div>
  );
}
