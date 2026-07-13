"use client";

import { useState } from "react";
import type { AreaGroup } from "@/lib/domain/grouping";
import type { ScoreValue } from "@/lib/domain/types";
import { SegmentedScore } from "./SegmentedScore";

export interface ScoreFormValues {
  scores: Map<string, ScoreValue>;
  observations: Map<string, string>;
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const scores = new Map<string, ScoreValue>();
    const observations = new Map<string, string>();
    for (const [subpointId, v] of Object.entries(values)) {
      if (v) scores.set(subpointId, Number(v) as ScoreValue);
    }
    for (const [subpointId, v] of Object.entries(obs)) {
      if (v) observations.set(subpointId, v);
    }
    onSubmit({ scores, observations });
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
              <div key={sp.subpoint_id} className="flex items-center gap-4 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">
                    <span className="font-code text-neutral mr-1.5">{sp.subpoint_id}</span>
                    {sp.subpoint_name}
                  </div>
                  <input
                    type="text"
                    placeholder="Observation (optional)"
                    className="w-full text-sm text-neutral bg-transparent mt-1 focus:outline-none focus:text-ink placeholder:text-neutral/70"
                    value={obs[sp.subpoint_id] ?? ""}
                    onChange={(e) => setObs((o) => ({ ...o, [sp.subpoint_id]: e.target.value }))}
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
