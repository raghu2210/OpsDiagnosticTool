"use client";

import { Fragment, useMemo, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import type { MasterRow, ProblemRow } from "@/lib/domain/types";
import { compareAreaIds, groupByArea, listModules } from "@/lib/domain/grouping";
import { Reveal } from "@/components/motion/Reveal";

async function downloadChecklist(
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

export function BuildFlow({ masters, problems }: { masters: MasterRow[]; problems: ProblemRow[] }) {
  const modules = useMemo(() => listModules(masters), [masters]);
  const [moduleId, setModuleId] = useState(modules[0]?.module_id);
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<{ kind: "full" | "combined"; message: string } | null>(null);

  const moduleRows = useMemo(() => masters.filter((r) => r.module_id === moduleId), [masters, moduleId]);
  const moduleName = moduleRows[0]?.module_name ?? "";
  const moduleProblems = useMemo(() => problems.filter((p) => p.module_id === moduleId), [problems, moduleId]);
  const problemsBySubpoint = useMemo(() => {
    const map = new Map<string, ProblemRow[]>();
    for (const p of moduleProblems) {
      const list = map.get(p.subpoint_id) ?? [];
      list.push(p);
      map.set(p.subpoint_id, list);
    }
    return map;
  }, [moduleProblems]);
  const areas = useMemo(() => groupByArea(moduleRows), [moduleRows]);

  function handleModuleChange(newId: string) {
    setModuleId(newId);
    setSelectedAreas(new Set());
  }

  function toggleArea(areaId: string) {
    setSelectedAreas((prev) => {
      const next = new Set(prev);
      next.has(areaId) ? next.delete(areaId) : next.add(areaId);
      return next;
    });
  }

  async function handleDownload(kind: "full" | "combined") {
    setDownloading(kind);
    setError(null);
    try {
      if (kind === "full") {
        await downloadChecklist(moduleName, moduleRows, undefined, `${moduleId}_full_checklist.xlsx`, moduleProblems);
      } else {
        const ids = areas.filter((a) => selectedAreas.has(a.area_id)).map((a) => a.area_id);
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
      }
    } catch (e) {
      setError({
        kind,
        message: e instanceof Error ? e.message : "Couldn't generate that checklist. Try again.",
      });
    } finally {
      setDownloading(null);
    }
  }

  const selectedList = areas.filter((a) => selectedAreas.has(a.area_id));

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

      <div className="pt-6 border-t border-rule">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold">{moduleName}</h2>
          <button
            onClick={() => handleDownload("full")}
            disabled={downloading !== null}
            className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xs bg-charcoal text-white hover:bg-ink transition-colors disabled:opacity-50"
          >
            {downloading === "full" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {downloading === "full" ? "Generating..." : "Download full module checklist"}
          </button>
        </div>
        {error?.kind === "full" && <p className="text-sm text-red mt-2 text-right">{error.message}</p>}
      </div>

      <Reveal>
        <div>
          <h3 className="font-display text-xl font-medium mb-1">Select one or more Areas</h3>
          <p className="text-sm text-neutral mb-4">
            Tap areas to toggle them on/off. Selected areas combine into a single checklist below.
          </p>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setSelectedAreas(new Set(areas.map((a) => a.area_id)))}
              className="text-sm font-medium px-3 py-1.5 rounded-xs border border-rule hover:border-accent transition-colors"
            >
              Select all
            </button>
            <button
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
      </Reveal>

      {selectedList.length > 0 ? (
        <Reveal>
          <div className="pt-6 border-t border-rule space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-medium">
                Checklist &middot; <span className="text-accent">{selectedList.length}</span> area
                {selectedList.length !== 1 ? "s" : ""} selected
              </h3>
              <button
                onClick={() => handleDownload("combined")}
                disabled={downloading !== null}
                className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xs bg-charcoal text-white hover:bg-ink transition-colors disabled:opacity-50"
              >
                {downloading === "combined" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {downloading === "combined"
                  ? "Generating..."
                  : `Download combined checklist (${selectedList.length})`}
              </button>
            </div>
            {error?.kind === "combined" && <p className="text-sm text-red -mt-4 text-right">{error.message}</p>}

            {selectedList.map((area) => (
              <div key={area.area_id}>
                <h4 className="font-display text-lg font-medium mb-3">
                  {area.area_id} &ndash; {area.area_name}: Sub-points
                </h4>
                <div className="overflow-x-auto rounded-sm border border-rule bg-surface shadow-md">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-black/[0.03] border-b border-rule text-left">
                        <th className="font-code font-medium text-xs text-neutral px-3 py-2 whitespace-nowrap">
                          ID
                        </th>
                        <th className="font-medium px-3 py-2">Sub-point</th>
                        <th className="font-code font-medium text-xs text-neutral px-3 py-2 whitespace-nowrap">
                          Weight
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {area.subpoints.map((sp) => {
                        const subProblems = problemsBySubpoint.get(sp.subpoint_id);
                        if (subProblems && subProblems.length > 0) {
                          return (
                            <Fragment key={sp.subpoint_id}>
                              <tr className="border-b border-rule bg-black/[0.03]">
                                <td className="font-code text-xs text-neutral px-3 py-2 align-top whitespace-nowrap font-medium">
                                  {sp.subpoint_id}
                                </td>
                                <td className="px-3 py-2 align-top font-medium">{sp.subpoint_name}</td>
                                <td className="font-code text-xs text-neutral px-3 py-2 align-top whitespace-nowrap">
                                  {(sp.subpoint_weight * 100).toFixed(0)}%
                                </td>
                              </tr>
                              {subProblems.map((p) => (
                                <tr key={p.problem_id} className="border-b border-rule last:border-b-0 hover:bg-black/[0.02]">
                                  <td className="font-code text-xs text-neutral px-3 py-2 pl-8 align-top whitespace-nowrap">
                                    {p.problem_id}
                                  </td>
                                  <td className="px-3 py-2 align-top">{p.problem_name}</td>
                                  <td className="font-code text-xs text-neutral px-3 py-2 align-top whitespace-nowrap">
                                    {(p.problem_weight * 100).toFixed(0)}%
                                  </td>
                                </tr>
                              ))}
                            </Fragment>
                          );
                        }
                        return (
                          <tr key={sp.subpoint_id} className="border-b border-rule last:border-b-0 hover:bg-black/[0.02]">
                            <td className="font-code text-xs text-neutral px-3 py-2 align-top whitespace-nowrap">
                              {sp.subpoint_id}
                            </td>
                            <td className="px-3 py-2 align-top">{sp.subpoint_name}</td>
                            <td className="font-code text-xs text-neutral px-3 py-2 align-top whitespace-nowrap">
                              {(sp.subpoint_weight * 100).toFixed(0)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      ) : (
        <p className="text-neutral text-sm border border-dashed border-rule rounded-md px-6 py-8 text-center">
          Select at least one Area above to generate its checklist.
        </p>
      )}
    </div>
  );
}
