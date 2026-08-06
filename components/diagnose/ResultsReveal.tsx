"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate, useMotionValueEvent } from "framer-motion";
import type { DiagnosticResult } from "@/lib/domain/types";
import { scoreBand } from "@/lib/domain/bands";

const RING_R = 64;
const RING_C = 2 * Math.PI * RING_R;

/** Shows whole numbers plainly (directly-scored items) and one decimal only for
 * fractional weighted rollups (Node-4 problem-statement items). */
function fmtScore(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/** Animated radial progress ring + count-up number whose color transitions across the
 * score-band palette as it crosses thresholds while counting - visualizes "weighted
 * average" as a real interaction, the signature moment this stack can do that Streamlit
 * structurally couldn't. Sits on a tinted surface (the band color at low opacity) so the
 * result reads as a real visual moment, not plain text on white. */
function ScoreDial({ value }: { value: number }) {
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(0);
  const rounded = useTransform(mv, (v) => Math.round(v * 10) / 10);
  useMotionValueEvent(rounded, "change", (v) => setDisplay(v));

  useEffect(() => {
    const controls = animate(mv, value, { duration: 1.1, ease: [0.23, 1, 0.32, 1] });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const band = scoreBand(display);
  const dash = RING_C * (display / 5);

  return (
    <div className="relative w-40 h-40 shrink-0">
      <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
        <circle cx="80" cy="80" r={RING_R} fill="none" stroke="var(--rule)" strokeWidth="10" />
        <circle
          cx="80"
          cy="80"
          r={RING_R}
          fill="none"
          stroke={band.color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${RING_C - dash}`}
          style={{ transition: "stroke 300ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className="font-display text-4xl font-semibold tabular-nums transition-colors duration-300"
          style={{ color: band.color }}
        >
          {display.toFixed(1)}
        </div>
        <div className="text-xs text-neutral mt-0.5">/ 5</div>
      </div>
    </div>
  );
}

function AreaBar({ areaId, areaName, score, delay }: { areaId: string; areaName: string; score: number; delay: number }) {
  const band = scoreBand(score);
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span>
          <span className="font-code text-neutral mr-1.5">{areaId}</span>
          {areaName}
        </span>
        <span className="font-code font-medium" style={{ color: band.color }}>
          {score.toFixed(2)}
        </span>
      </div>
      <div className="h-2 rounded-xs bg-rule overflow-hidden">
        <motion.div
          className="h-full rounded-xs"
          style={{ backgroundColor: band.color }}
          initial={{ width: 0 }}
          animate={{ width: `${(score / 5) * 100}%` }}
          transition={{ duration: 0.8, delay, ease: [0.23, 1, 0.32, 1] }}
        />
      </div>
    </div>
  );
}

/** Common shape for a priority-list entry, whichever tree level it came from - a
 * directly-scored sub-point (Node 3) or a scored problem statement (Node 4). Sub-points
 * that have been broken down to Node 4 are represented by their problems instead of
 * themselves, so nothing shows up twice at two levels of granularity. */
interface PriorityItem {
  key: string;
  code: string;
  areaName: string;
  label: string;
  score: number;
  levelName: string;
  target: number;
  targetName: string;
  weightedGap: number;
  observation: string;
  tasks: string;
}

export function ResultsReveal({ diag }: { diag: DiagnosticResult }) {
  if (diag.n_scored === 0) {
    return <p className="text-neutral">No scores yet - fill in at least one Score (1-5) above.</p>;
  }

  // Heavier areas settle first: rank by area_weight descending, delay by rank (not by
  // area_id display order, which stays alphabetical for a stable, scannable list).
  const weightRank = new Map(
    [...diag.area_scores].sort((a, b) => b.area_weight - a.area_weight).map((a, i) => [a.area_id, i])
  );

  const problemSubpointIds = new Set(diag.scored_problems.map((p) => p.subpoint_id));
  const priority: PriorityItem[] = [
    ...diag.scored
      .filter((s) => s.score < 5 && !problemSubpointIds.has(s.subpoint_id))
      .map((s): PriorityItem => ({
        key: s.subpoint_id,
        code: s.subpoint_id,
        areaName: s.area_name,
        label: s.subpoint_name,
        score: s.score,
        levelName: s.level_name,
        target: s.target,
        targetName: s.target_name,
        weightedGap: s.weighted_gap,
        observation: s.observation,
        tasks: s.tasks,
      })),
    ...diag.scored_problems
      .filter((p) => p.score < 5)
      .map((p): PriorityItem => ({
        key: p.problem_id,
        code: p.problem_id,
        areaName: p.area_name,
        label: `${p.subpoint_name} / ${p.problem_name}`,
        score: p.score,
        levelName: p.level_name,
        target: p.target,
        targetName: p.target_name,
        weightedGap: p.weighted_gap,
        observation: p.observation,
        tasks: p.tasks,
      })),
  ].sort((a, b) => b.weightedGap - a.weightedGap);

  const moduleBand = scoreBand(diag.module_score);

  return (
    <div className="space-y-10">
      <div
        className="rounded-md p-6 md:p-8 flex items-center gap-6 md:gap-10 flex-wrap"
        style={{ backgroundColor: `${moduleBand.color}12` }}
      >
        <ScoreDial value={diag.module_score} />
        <div>
          <div className="font-code text-sm font-medium mb-3" style={{ color: moduleBand.color }}>
            {moduleBand.label}
          </div>
          <div className="flex gap-8 font-code text-sm">
            <div>
              <div className="text-xl font-medium">{diag.pct.toFixed(0)}%</div>
              <div className="text-neutral text-xs uppercase tracking-wider mt-1">of potential</div>
            </div>
            <div>
              <div className="text-xl font-medium">
                {diag.n_scored}
              </div>
              <div className="text-neutral text-xs uppercase tracking-wider mt-1">
                {diag.n_scored === 1 ? "sub point analysed" : "sub points analysed"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-display text-xl font-medium mb-4">Area maturity</h3>
        <div className="space-y-4">
          {diag.area_scores.map((a) => (
            <AreaBar
              key={a.area_id}
              areaId={a.area_id}
              areaName={a.area_name}
              score={a.area_score}
              delay={(weightRank.get(a.area_id) ?? 0) * 0.08}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-display text-xl font-medium mb-1">Priority actions</h3>
        <p className="text-sm text-neutral mb-4">Ranked by weighted impact - low score &times; high weight first.</p>
        {priority.length === 0 ? (
          <p className="text-sm text-green font-medium">Every scored sub-point is already best-in-class.</p>
        ) : (
          <div className="divide-y divide-rule border border-rule rounded-md bg-surface shadow-sm overflow-hidden">
            {priority.map((s, i) => {
              const band = scoreBand(s.score);
              return (
                <details key={s.key} className="group" style={{ borderLeft: `3px solid ${band.color}` }}>
                  <summary className="cursor-pointer list-none flex items-center gap-3 pl-3.5 pr-4 py-3 hover:bg-black/[0.02] transition-colors">
                    <span className="font-code text-xs text-neutral/70 w-5 text-right shrink-0 tabular-nums">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium flex-1 min-w-0 truncate">
                      <span className="font-code text-neutral mr-1.5">{s.code}</span>
                      {s.areaName} &middot; {s.label}
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0 font-code text-xs tabular-nums">
                      <span
                        className="px-1.5 py-0.5 rounded-xs font-medium text-white"
                        style={{ backgroundColor: band.color }}
                      >
                        {fmtScore(s.score)}
                      </span>
                      <span className="text-neutral">&rarr;</span>
                      <span className="px-1.5 py-0.5 rounded-xs border border-rule text-neutral">
                        {fmtScore(s.target)}
                      </span>
                    </span>
                    <span className="text-neutral group-open:rotate-90 transition-transform shrink-0">&rsaquo;</span>
                  </summary>
                  <div className="pl-12 pr-4 pb-4 text-sm text-neutral">
                    <p className="mb-2">
                      Currently <span className="font-medium" style={{ color: band.color }}>{s.levelName}</span>
                      {" "}({fmtScore(s.score)}) &rarr; target{" "}
                      <span className="font-medium text-ink">{s.targetName}</span> ({fmtScore(s.target)})
                    </p>
                    {s.observation && <p className="mb-2 italic">Observation: {s.observation}</p>}
                    {s.tasks ? (
                      <ul className="list-disc pl-5 space-y-1">
                        {s.tasks.split("\n").filter(Boolean).map((t, idx) => (
                          <li key={idx}>{t}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>No recommendation authored yet for this sub-point/level.</p>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
