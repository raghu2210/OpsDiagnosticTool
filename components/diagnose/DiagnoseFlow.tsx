"use client";

import { useMemo, useState } from "react";
import { Check, Loader2 } from "lucide-react";
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
  const [mode, setMode] = useState<InputMode>("form");
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(new Set());
  const [diag, setDiag] = useState<DiagnosticResult | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const moduleRows = useMemo(() => masters.filter((r) => r.module_id === moduleId), [masters, moduleId]);
  const moduleProblems = useMemo(() => problems.filter((r) => r.module_id === moduleId), [problems, moduleId]);
  const areas = useMemo(() => groupByArea(moduleRows), [moduleRows]);
  const scoredAreas = useMemo(() => areas.filter((a) => selectedAreas.has(a.area_id)), [areas, selectedAreas]);
  const moduleName = moduleRows[0]?.module_name ?? "";

  function handleModuleChange(newId: string) {
    setModuleId(newId);
    setSelectedAreas(new Set());
    setDiag(null);
  }

  function toggleArea(areaId: string) {
    setSelectedAreas((prev) => {
      const next = new Set(prev);
      next.has(areaId) ? next.delete(areaId) : next.add(areaId);
      return next;
    });
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
              ["form", "Score in-app"],
              ["upload", "Upload filled checklist"],
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
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-lg font-medium mb-1">Select one or more Areas</h3>
              <p className="text-sm text-neutral mb-4">
                Tap areas to toggle them on/off. Only selected areas are shown below to score.
              </p>
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setSelectedAreas(new Set(areas.map((a) => a.area_id)))}
                  className="text-sm font-medium px-3 py-1.5 rounded-xs border border-rule hover:border-accent transition-colors"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAreas(new Set())}
                  className="text-sm font-medium px-3 py-1.5 rounded-xs border border-rule hover:border-accent transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {areas.map((area) => {
                  const picked = selectedAreas.has(area.area_id);
                  return (
                    <button
                      type="button"
                      key={area.area_id}
                      onClick={() => toggleArea(area.area_id)}
                      className={`text-left px-4 py-3 rounded-sm border shadow-sm transition-colors ${
                        picked ? "border-accent bg-accent/5" : "border-rule bg-surface hover:border-charcoal"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-code text-xs text-neutral">{area.area_id}</span>
                        {picked && <Check className="w-4 h-4 text-accent" />}
                      </div>
                      <div className="text-sm font-medium mb-0.5">{area.area_name}</div>
                      <div className="font-code text-xs text-neutral">weight {(area.area_weight * 100).toFixed(0)}%</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {scoredAreas.length > 0 ? (
              <div className="pt-6 border-t border-rule">
                <ScoreForm
                  key={`${moduleId}:${[...selectedAreas].sort().join(",")}`}
                  areas={scoredAreas}
                  problems={moduleProblems}
                  onSubmit={handleSubmit}
                />
              </div>
            ) : (
              <p className="text-neutral text-sm border border-dashed border-rule rounded-md px-6 py-8 text-center">
                Select at least one Area above to start scoring.
              </p>
            )}
          </div>
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
