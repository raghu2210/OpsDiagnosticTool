"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import type {
  MasterRow,
  ProblemRow,
  RecommendationRow,
  DiagnosticResult,
  SubpointScore,
  WeightProfileRow,
} from "@/lib/domain/types";
import { compareAreaIds, groupByArea, listModules } from "@/lib/domain/grouping";
import { computeDiagnostic, toScoreMaps } from "@/lib/domain/scoring";
import { applyCustomWeights, applyWeightProfile, listWeightProfiles } from "@/lib/domain/weight-profiles";
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
  weightProfiles,
  initialModuleId,
}: {
  masters: MasterRow[];
  recommendations: RecommendationRow[];
  problems: ProblemRow[];
  weightProfiles: WeightProfileRow[];
  initialModuleId?: string;
}) {
  const modules = useMemo(() => listModules(masters), [masters]);
  const [moduleId, setModuleId] = useState(
    initialModuleId && modules.some((m) => m.module_id === initialModuleId) ? initialModuleId : modules[0]?.module_id
  );
  const profiles = useMemo(() => listWeightProfiles(weightProfiles), [weightProfiles]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [customDescription, setCustomDescription] = useState("");
  const [customWeights, setCustomWeights] = useState<Record<string, number> | null>(null);
  const [customReasons, setCustomReasons] = useState<Record<string, string> | null>(null);
  const [customSummary, setCustomSummary] = useState<string | null>(null);
  const [generatingCustom, setGeneratingCustom] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);
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
  const effectiveRows = useMemo(
    () =>
      profileId === "custom"
        ? applyCustomWeights(moduleRows, customWeights)
        : applyWeightProfile(moduleRows, weightProfiles, profileId),
    [moduleRows, weightProfiles, profileId, customWeights]
  );
  const areas = useMemo(() => groupByArea(effectiveRows), [effectiveRows]);
  const scoredAreas = useMemo(() => areas.filter((a) => selectedAreas.has(a.area_id)), [areas, selectedAreas]);
  const moduleName = moduleRows[0]?.module_name ?? "";

  // Before/after share per area, so the custom-weights panel can show exactly what moved
  // (e.g. "Picking 4% -> 9%") instead of leaving the reviewer to infer it from the prose
  // summary alone. "Before" is always the module's own default weighting, not whatever
  // profile happened to be active before switching to "custom".
  const baselineAreas = useMemo(() => groupByArea(moduleRows), [moduleRows]);
  const weightChanges = useMemo(() => {
    if (!customWeights) return [];
    const totalBefore = baselineAreas.reduce((sum, a) => sum + Number(a.area_weight), 0);
    const totalAfter = Object.values(customWeights).reduce((sum, w) => sum + Number(w), 0);
    return baselineAreas
      .map((a) => {
        const before = totalBefore > 0 ? (Number(a.area_weight) / totalBefore) * 100 : 0;
        const afterRaw = customWeights[a.area_id] ?? 1;
        const after = totalAfter > 0 ? (afterRaw / totalAfter) * 100 : 0;
        return {
          area_id: a.area_id,
          area_name: a.area_name,
          before,
          after,
          delta: after - before,
          reason: customReasons?.[a.area_id] ?? "",
        };
      })
      .filter((c) => Math.round(c.before) !== Math.round(c.after))
      .sort((a, b) => b.delta - a.delta);
  }, [baselineAreas, customWeights, customReasons]);

  function resetCustomWeights() {
    setCustomDescription("");
    setCustomWeights(null);
    setCustomReasons(null);
    setCustomSummary(null);
    setCustomError(null);
  }

  function handleModuleChange(newId: string) {
    setModuleId(newId);
    setSelectedAreas(new Set());
    setDiag(null);
    resetCustomWeights();
  }

  function handleProfileChange(newId: string) {
    setProfileId(newId || null);
    setDiag(null);
    if (newId !== "custom") resetCustomWeights();
  }

  async function handleGenerateCustomWeights() {
    setGeneratingCustom(true);
    setCustomError(null);
    try {
      const resp = await fetch("/api/diagnostic/weight-profile-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: customDescription,
          areas: areas.map((a) => ({ area_id: a.area_id, area_name: a.area_name })),
        }),
      });
      const data: {
        weights: Record<string, number> | null;
        reasons: Record<string, string> | null;
        summary: string | null;
      } = await resp.json();
      if (!data.weights || !data.summary) {
        setCustomError("Couldn't generate weights from that description. Try adding more detail.");
        return;
      }
      setCustomWeights(data.weights);
      setCustomReasons(data.reasons ?? null);
      setCustomSummary(data.summary);
      setDiag(null);
    } catch {
      setCustomError("Couldn't reach the weighting assistant. Try again.");
    } finally {
      setGeneratingCustom(false);
    }
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
        effectiveRows,
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
      computeDiagnostic(effectiveRows, scores, observations, recommendations, undefined, moduleProblems, problemScores)
    );
  }

  async function handleExportChecklist() {
    setExportingChecklist(true);
    setExportError(null);
    try {
      const ids = scoredAreas.map((a) => a.area_id);
      const combinedRows = effectiveRows
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
      <div className="flex flex-wrap gap-6">
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
          <label className="text-sm font-medium block mb-1.5" htmlFor="profile-select">
            Weight profile
          </label>
          <select
            id="profile-select"
            className="border border-rule rounded-xs px-3 py-2 text-sm min-w-72 focus:outline-none focus:border-accent"
            value={profileId ?? ""}
            onChange={(e) => handleProfileChange(e.target.value)}
          >
            <option value="">Default (equal weighting)</option>
            {profiles.map((p) => (
              <option key={p.profile_id} value={p.profile_id}>
                {p.profile_name}
              </option>
            ))}
            <option value="custom">Describe your own priorities</option>
          </select>
        </div>
      </div>

      {profileId === "custom" && (
        <div className="border border-rule rounded-md p-4 bg-surface shadow-sm space-y-3">
          <label className="text-sm font-medium block" htmlFor="custom-priorities">
            What does this company care about most?
          </label>
          <textarea
            id="custom-priorities"
            rows={3}
            className="w-full border border-rule rounded-xs px-3 py-2 text-sm focus:outline-none focus:border-accent"
            placeholder="e.g. We're a premium grocery player - quality and freshness matter far more than speed. We're fine being slower if it means better cold-chain and QA."
            value={customDescription}
            onChange={(e) => setCustomDescription(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleGenerateCustomWeights}
              disabled={generatingCustom || customDescription.trim().length < 12}
              className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xs bg-charcoal text-white hover:bg-ink transition-colors disabled:opacity-50"
            >
              {generatingCustom && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {generatingCustom ? "Generating..." : customWeights ? "Regenerate weights" : "Generate weights"}
            </button>
            {customError && <p className="text-sm text-red">{customError}</p>}
          </div>
          {customSummary && <p className="text-sm text-neutral border-t border-rule pt-3">{customSummary}</p>}
          {weightChanges.length > 0 && (
            <div className="divide-y divide-rule">
              {weightChanges.map((c) => (
                <div key={c.area_id} className="py-2">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">
                      <span className="font-code text-xs text-neutral mr-1.5">{c.area_id}</span>
                      {c.area_name}
                    </span>
                    <span className={`font-code text-xs shrink-0 ${c.delta > 0 ? "text-green" : "text-red"}`}>
                      {c.before.toFixed(0)}% &rarr; {c.after.toFixed(0)}% {c.delta > 0 ? "▲" : "▼"}
                    </span>
                  </div>
                  {c.reason && <p className="text-xs text-neutral mt-0.5">{c.reason}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
