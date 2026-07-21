"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronRight, ImagePlus, X } from "lucide-react";
import type { AreaGroup } from "@/lib/domain/grouping";
import type { ProblemRow, ScoreValue } from "@/lib/domain/types";
import { scoreBand } from "@/lib/domain/bands";
import { SegmentedScore } from "./SegmentedScore";

export interface ScoreFormValues {
  scores: Map<string, ScoreValue>;
  /** Node-4 problem-statement scores, keyed by problem_id. */
  problemScores: Map<string, ScoreValue>;
  observations: Map<string, string>;
  photos: Map<string, string>;
}

const MAX_OBSERVATION_WORDS = 250;
// Resize/compress client-side before it ever enters state - keeps the eventual PDF-export
// request body small. Never uploaded or persisted anywhere; lives only in this session's
// React state until the diagnostic is submitted and (optionally) exported to PDF.
const MAX_PHOTO_DIMENSION = 1000;
const PHOTO_JPEG_QUALITY = 0.7;

function capWords(value: string): string {
  const words = value.split(/\s+/).filter(Boolean);
  return words.length > MAX_OBSERVATION_WORDS ? words.slice(0, MAX_OBSERVATION_WORDS).join(" ") : value;
}

function wordCount(value: string): number {
  return value.split(/\s+/).filter(Boolean).length;
}

function resizeImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_PHOTO_DIMENSION / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", PHOTO_JPEG_QUALITY));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't read that image"));
    };
    img.src = url;
  });
}

/** Weighted rollup of whichever problem statements have been scored so far, for a live
 * preview in the sub-point header - purely a display convenience. The authoritative
 * computation happens in computeDiagnostic() on submit. */
function liveRollup(subProblems: ProblemRow[], values: Record<string, string>): number | null {
  const scored = subProblems.filter((p) => values[p.problem_id]);
  if (scored.length === 0) return null;
  const w = scored.reduce((s, p) => s + p.problem_weight, 0);
  const weighted = scored.reduce((s, p) => s + Number(values[p.problem_id]) * p.problem_weight, 0);
  return w ? weighted / w : scored.reduce((s, p) => s + Number(values[p.problem_id]), 0) / scored.length;
}

function AutoGrowTextarea({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function resize() {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  return (
    <div>
      <textarea
        ref={ref}
        rows={1}
        placeholder="Observation (optional)"
        className="w-full text-sm text-neutral bg-transparent mt-1 focus:outline-none focus:text-ink placeholder:text-neutral/70 resize-none overflow-hidden leading-normal"
        value={value}
        onChange={(e) => {
          onChange(capWords(e.target.value));
          resize();
        }}
      />
      {value && (
        <div className="text-xs text-neutral/70 mt-0.5">
          {wordCount(value)} / {MAX_OBSERVATION_WORDS} words
        </div>
      )}
    </div>
  );
}

function PhotoAttach({
  photo,
  onAttach,
  onRemove,
}: {
  photo: string | undefined;
  onAttach: (dataUrl: string) => void;
  onRemove: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    setBusy(true);
    try {
      onAttach(await resizeImageToDataUrl(file));
    } finally {
      setBusy(false);
    }
  }

  if (photo) {
    return (
      <div className="relative mt-2 inline-block">
        {/* eslint-disable-next-line @next/next/no-img-element -- client-only base64 data URI, not an optimizable static asset */}
        <img src={photo} alt="" className="h-14 w-14 rounded-xs object-cover border border-rule" />
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove photo"
          className="absolute -top-1.5 -right-1.5 bg-charcoal text-white rounded-full p-0.5 hover:bg-ink transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <label className="inline-flex items-center gap-1.5 mt-2 text-xs text-neutral hover:text-accent transition-colors cursor-pointer">
      <ImagePlus className="w-3.5 h-3.5" />
      {busy ? "Processing..." : "Attach photo"}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </label>
  );
}

/** One sub-point row's observation + photo + score picker - shared by both the direct
 * scoring row and each nested problem-statement row, just keyed by a different id. */
function ScorableRow({
  id,
  label,
  code,
  obsValue,
  onObsChange,
  photo,
  onPhotoAttach,
  onPhotoRemove,
  scoreValue,
  onScoreChange,
  indent,
}: {
  id: string;
  label: string;
  code: string;
  obsValue: string;
  onObsChange: (v: string) => void;
  photo: string | undefined;
  onPhotoAttach: (dataUrl: string) => void;
  onPhotoRemove: () => void;
  scoreValue: string;
  onScoreChange: (v: string) => void;
  indent?: boolean;
}) {
  return (
    <div className={`flex items-start gap-4 px-4 py-3 ${indent ? "pl-8" : ""}`}>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">
          <span className="font-code text-neutral mr-1.5">{code}</span>
          {label}
        </div>
        <AutoGrowTextarea value={obsValue} onChange={onObsChange} />
        <PhotoAttach photo={photo} onAttach={onPhotoAttach} onRemove={onPhotoRemove} />
      </div>
      <SegmentedScore value={scoreValue} onChange={onScoreChange} />
    </div>
  );
}

export function ScoreForm({
  areas,
  problems = [],
  onSubmit,
}: {
  areas: AreaGroup[];
  problems?: ProblemRow[];
  onSubmit: (values: ScoreFormValues) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [obs, setObs] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleExpanded(subpointId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(subpointId) ? next.delete(subpointId) : next.add(subpointId);
      return next;
    });
  }

  const problemsBySubpoint = useMemo(() => {
    const map = new Map<string, ProblemRow[]>();
    for (const p of problems) {
      const list = map.get(p.subpoint_id) ?? [];
      list.push(p);
      map.set(p.subpoint_id, list);
    }
    return map;
  }, [problems]);
  const problemIdSet = useMemo(() => new Set(problems.map((p) => p.problem_id)), [problems]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const scores = new Map<string, ScoreValue>();
    const problemScores = new Map<string, ScoreValue>();
    for (const [id, v] of Object.entries(values)) {
      if (!v) continue;
      (problemIdSet.has(id) ? problemScores : scores).set(id, Number(v) as ScoreValue);
    }
    const observations = new Map<string, string>();
    for (const [id, v] of Object.entries(obs)) {
      if (v) observations.set(id, v);
    }
    const photoMap = new Map<string, string>();
    for (const [id, v] of Object.entries(photos)) {
      if (v) photoMap.set(id, v);
    }
    onSubmit({ scores, problemScores, observations, photos: photoMap });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {areas.map((area) => (
        <div key={area.area_id}>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="font-code text-sm text-neutral">{area.area_id}</span>
            <h3 className="font-display text-lg font-medium">{area.area_name}</h3>
            <span className="font-code text-xs text-neutral ml-auto">weight {(area.area_weight * 100).toFixed(0)}%</span>
          </div>
          <div className="border border-rule rounded-md divide-y divide-rule bg-surface shadow-sm">
            {area.subpoints.map((sp) => {
              const subProblems = problemsBySubpoint.get(sp.subpoint_id);
              if (subProblems && subProblems.length > 0) {
                const rollup = liveRollup(subProblems, values);
                const band = rollup !== null ? scoreBand(rollup) : null;
                const isOpen = expanded.has(sp.subpoint_id);
                return (
                  <div key={sp.subpoint_id}>
                    <button
                      type="button"
                      onClick={() => toggleExpanded(sp.subpoint_id)}
                      className="w-full flex items-center justify-between gap-4 px-4 py-3 bg-black/[0.03] text-left hover:bg-black/[0.05] transition-colors"
                    >
                      <div className="text-sm font-medium flex items-center gap-1.5 min-w-0">
                        <ChevronRight
                          className={`w-3.5 h-3.5 shrink-0 text-neutral transition-transform ${isOpen ? "rotate-90" : ""}`}
                        />
                        <span className="font-code text-neutral">{sp.subpoint_id}</span>
                        <span className="truncate">{sp.subpoint_name}</span>
                        <span className="font-code text-xs text-neutral font-normal shrink-0">
                          {subProblems.length} problem statements
                        </span>
                      </div>
                      {band ? (
                        <span className="font-code text-sm font-medium shrink-0" style={{ color: band.color }}>
                          {rollup!.toFixed(1)} / 5 &middot; {band.label}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral shrink-0">Not yet scored</span>
                      )}
                    </button>
                    {isOpen && (
                      <div className="divide-y divide-rule">
                        {subProblems.map((p) => (
                          <ScorableRow
                            key={p.problem_id}
                            id={p.problem_id}
                            code={p.problem_id}
                            label={p.problem_name}
                            obsValue={obs[p.problem_id] ?? ""}
                            onObsChange={(v) => setObs((o) => ({ ...o, [p.problem_id]: v }))}
                            photo={photos[p.problem_id]}
                            onPhotoAttach={(dataUrl) => setPhotos((ph) => ({ ...ph, [p.problem_id]: dataUrl }))}
                            onPhotoRemove={() => setPhotos((ph) => ({ ...ph, [p.problem_id]: "" }))}
                            scoreValue={values[p.problem_id] ?? ""}
                            onScoreChange={(v) => setValues((prev) => ({ ...prev, [p.problem_id]: v }))}
                            indent
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <ScorableRow
                  key={sp.subpoint_id}
                  id={sp.subpoint_id}
                  code={sp.subpoint_id}
                  label={sp.subpoint_name}
                  obsValue={obs[sp.subpoint_id] ?? ""}
                  onObsChange={(v) => setObs((o) => ({ ...o, [sp.subpoint_id]: v }))}
                  photo={photos[sp.subpoint_id]}
                  onPhotoAttach={(dataUrl) => setPhotos((ph) => ({ ...ph, [sp.subpoint_id]: dataUrl }))}
                  onPhotoRemove={() => setPhotos((ph) => ({ ...ph, [sp.subpoint_id]: "" }))}
                  scoreValue={values[sp.subpoint_id] ?? ""}
                  onScoreChange={(v) => setValues((prev) => ({ ...prev, [sp.subpoint_id]: v }))}
                />
              );
            })}
          </div>
        </div>
      ))}
      <button
        type="submit"
        className="text-sm font-medium px-5 py-2.5 rounded-xs bg-charcoal text-white hover:bg-ink transition-colors"
      >
        Run diagnostic
      </button>
    </form>
  );
}
