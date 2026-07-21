"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import type { MasterRow, ProblemRow, RecommendationRow, DiagnosticResult, SubpointScore } from "@/lib/domain/types";
import { compareAreaIds, groupByArea, listModules } from "@/lib/domain/grouping";
import { computeDiagnostic, toScoreMaps } from "@/lib/domain/scoring";
import { downloadChecklist } from "@/lib/xlsx/download-checklist-client";
import { AreaPicker } from "@/components/areas/AreaPicker";
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
  const [exportingChecklist, setExportingChecklist] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Scroll the results into view the moment a diagnostic is computed (or re-computed by
  // running again) - the scoring form can be long, so surfacing the report is worth more
  // than leaving the user to scroll down and find it themselves.
  useEffect(() => {
    if (diag) resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [diag]);

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

  async function handleExportChecklist() {
    setExportingChecklist(true);
    setExportError(null);
    try {
      const ids = scoredAreas.map((a) => a.area_id);
      const combinedRows = moduleRows
        .filter((r) => selectedAreas.has(r.area_id))
        .sort(
          (a, b) =>
            compareAreaIds(a.area_id, b.area_id) ||
            a.subpoint_id.localeCompare(b.subpoint_id, undefined, { numeric: true })
        );
      await downloadChecklist(
        moduleName,
        combinedRows,
        ids.join(", "),
        `${moduleId}_${ids.join("-")}_checklist.xlsx`,
        moduleProblems
      );
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "Couldn't generate that checklist. Try again.");
    } finally {
      setExportingChecklist(false);
    }
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
                Tap areas to toggle them on/off. Score them directly below, or export a fillable checklist for
                the same selection to fill in on the ground.
              </p>
              <AreaPicker
                areas={areas}
                selected={selectedAreas}
                onToggle={toggleArea}
                onSelectAll={() => setSelectedAreas(new Set(areas.map((a) => a.area_id)))}
                onClear={() => setSelectedAreas(new Set())}
              />
            </div>

            {scoredAreas.length > 0 ? (
              <div className="pt-6 border-t border-rule space-y-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <h3 className="font-display text-lg font-medium">
                    Score in-app &middot; <span className="text-accent">{scoredAreas.length}</span> area
                    {scoredAreas.length !== 1 ? "s" : ""} selected
                  </h3>
                  <button
                    type="button"
                    onClick={handleExportChecklist}
                    disabled={exportingChecklist}
                    className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xs border border-rule hover:border-charcoal transition-colors disabled:opacity-50"
                  >
                    {exportingChecklist && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {exportingChecklist
                      ? "Generating..."
                      : `Export checklist for offline use (${scoredAreas.length})`}
                  </button>
                </div>
                {exportError && <p className="text-sm text-red -mt-2 text-right">{exportError}</p>}
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
        <div ref={resultsRef} className="pt-8 border-t border-rule scroll-mt-24">
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
