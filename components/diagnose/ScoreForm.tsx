"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import type { AreaGroup } from "@/lib/domain/grouping";
import type { ScoreValue } from "@/lib/domain/types";
import { SegmentedScore } from "./SegmentedScore";

export interface ScoreFormValues {
  scores: Map<string, ScoreValue>;
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

export function ScoreForm({
  areas,
  onSubmit,
}: {
  areas: AreaGroup[];
  onSubmit: (values: ScoreFormValues) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [obs, setObs] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const scores = new Map<string, ScoreValue>();
    const observations = new Map<string, string>();
    const photoMap = new Map<string, string>();
    for (const [subpointId, v] of Object.entries(values)) {
      if (v) scores.set(subpointId, Number(v) as ScoreValue);
    }
    for (const [subpointId, v] of Object.entries(obs)) {
      if (v) observations.set(subpointId, v);
    }
    for (const [subpointId, v] of Object.entries(photos)) {
      if (v) photoMap.set(subpointId, v);
    }
    onSubmit({ scores, observations, photos: photoMap });
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
            {area.subpoints.map((sp) => (
              <div key={sp.subpoint_id} className="flex items-start gap-4 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">
                    <span className="font-code text-neutral mr-1.5">{sp.subpoint_id}</span>
                    {sp.subpoint_name}
                  </div>
                  <AutoGrowTextarea
                    value={obs[sp.subpoint_id] ?? ""}
                    onChange={(v) => setObs((o) => ({ ...o, [sp.subpoint_id]: v }))}
                  />
                  <PhotoAttach
                    photo={photos[sp.subpoint_id]}
                    onAttach={(dataUrl) => setPhotos((p) => ({ ...p, [sp.subpoint_id]: dataUrl }))}
                    onRemove={() => setPhotos((p) => ({ ...p, [sp.subpoint_id]: "" }))}
                  />
                </div>
                <SegmentedScore
                  value={values[sp.subpoint_id] ?? ""}
                  onChange={(v) => setValues((prev) => ({ ...prev, [sp.subpoint_id]: v }))}
                />
              </div>
            ))}
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
