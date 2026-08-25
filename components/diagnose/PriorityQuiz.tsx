"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import type { MasterRow, WeightProfileRow } from "@/lib/domain/types";
import {
  computeProfileShares,
  computeQuizAreaWeights,
  MAX_PICKS_PER_QUESTION,
  PROFILE_LABELS,
  PROFILE_TAGS,
  QUIZ_QUESTIONS,
  summarizeProfile,
  type ProfileTag,
} from "@/lib/domain/priority-quiz";
import { groupByArea } from "@/lib/domain/grouping";

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

/** Mandatory, gamified 10-question company-profile quiz shown right after a module is picked
 * and before Area selection - see lib/domain/priority-quiz.ts for the weighting math. Ends
 * with a "Company profile" reveal, then calls onComplete with the blended Area weights. */
export function PriorityQuiz({
  profiles,
  moduleRows,
  onComplete,
}: {
  profiles: WeightProfileRow[];
  moduleRows: MasterRow[];
  onComplete: (weights: Record<string, number>, summary: string) => void;
}) {
  const [picks, setPicks] = useState<ProfileTag[][]>(() => QUIZ_QUESTIONS.map(() => []));
  const [current, setCurrent] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const shares = useMemo(() => computeProfileShares(picks), [picks]);
  const baselineAreas = useMemo(() => groupByArea(moduleRows), [moduleRows]);

  /** Toggles a tag for the current question - picking a 3rd tag once 2 are already chosen is
   * a no-op (the option renders disabled) rather than bumping the oldest pick out. */
  function toggle(tag: ProfileTag) {
    setPicks((prev) => {
      const next = [...prev];
      const current_ = next[current];
      if (current_.includes(tag)) {
        next[current] = current_.filter((t) => t !== tag);
      } else if (current_.length < MAX_PICKS_PER_QUESTION) {
        next[current] = [...current_, tag];
      }
      return next;
    });
  }

  function goNext() {
    if (picks[current].length === 0) return;
    if (current < QUIZ_QUESTIONS.length - 1) setCurrent((c) => c + 1);
    else setRevealed(true);
  }

  function goBack() {
    if (current > 0) setCurrent((c) => c - 1);
  }

  if (revealed) {
    const weights = computeQuizAreaWeights(profiles, shares);
    const totalAfter = Object.values(weights).reduce((s, w) => s + w, 0);
    const totalBefore = baselineAreas.reduce((s, a) => s + Number(a.area_weight), 0);
    const ranked = [...PROFILE_TAGS].sort((a, b) => shares[b] - shares[a]);
    const top = ranked[0];

    const movers = baselineAreas
      .map((a) => {
        const before = totalBefore > 0 ? (Number(a.area_weight) / totalBefore) * 100 : 0;
        const afterRaw = weights[a.area_id] ?? 1;
        const after = totalAfter > 0 ? (afterRaw / totalAfter) * 100 : 0;
        return { area_id: a.area_id, area_name: a.area_name, before, after, delta: after - before };
      })
      .filter((m) => Math.round(m.before) !== Math.round(m.after))
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 6);

    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-display text-xl font-semibold mb-1">Company profile</h3>
          <p className="text-sm text-neutral max-w-xl">
            Cumulative weight across all 10 questions &mdash; always adds to 100%. This mix now
            sets the Area weights before you pick which Areas to score.
          </p>
        </div>

        <div className="border border-rule rounded-md bg-surface shadow-sm p-5 space-y-4">
          <div className="flex items-baseline gap-2 pb-3 border-b border-rule">
            <span className="font-code text-xs text-neutral uppercase tracking-wide">Leading profile</span>
            <span className="font-display text-lg font-semibold text-accent">{PROFILE_LABELS[top]}</span>
          </div>
          {ranked.map((tag) => (
            <div key={tag} className="space-y-1.5">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium">{PROFILE_LABELS[tag]}</span>
                <span className="font-code text-neutral">{Math.round(shares[tag])}%</span>
              </div>
              <div className="h-2 rounded-full bg-black/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${Math.round(shares[tag])}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {movers.length > 0 && (
          <div className="border border-rule rounded-md bg-surface shadow-sm divide-y divide-rule overflow-hidden">
            <div className="px-4 py-2.5 text-sm text-neutral">Areas that moved most</div>
            {movers.map((m) => (
              <div key={m.area_id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="font-code text-xs text-neutral w-8 shrink-0">{m.area_id}</span>
                <span className="text-sm flex-1 min-w-0 truncate">{m.area_name}</span>
                <span
                  className={`font-code text-xs shrink-0 ${m.delta > 0 ? "text-green" : "text-red"}`}
                >
                  {m.before.toFixed(0)}% &rarr; {m.after.toFixed(0)}% {m.delta > 0 ? "▲" : "▼"}
                </span>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => onComplete(weights, summarizeProfile(shares))}
          className="text-sm font-medium px-5 py-2.5 rounded-xs bg-charcoal text-white hover:bg-ink transition-colors"
        >
          Continue to Area selection
        </button>
      </div>
    );
  }

  const question = QUIZ_QUESTIONS[current];
  const pickedTags = picks[current];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex-1 flex gap-1">
          {QUIZ_QUESTIONS.map((_, i) => (
            <div key={i} className="h-1.5 flex-1 rounded-full bg-black/[0.08] overflow-hidden">
              <div
                className="h-full bg-accent transition-transform duration-300 origin-left"
                style={{ transform: `scaleX(${i <= current ? 1 : 0})` }}
              />
            </div>
          ))}
        </div>
        <span className="font-code text-xs text-neutral shrink-0">
          {current + 1} / {QUIZ_QUESTIONS.length}
        </span>
      </div>

      <div className="border border-rule rounded-md bg-surface shadow-sm p-6 space-y-5 min-h-[22rem] flex flex-col">
        <div>
          <div className="font-code text-xs text-accent mb-2">
            QUESTION {current + 1} &middot; worth 10%
          </div>
          <h3 className="font-display text-lg font-semibold leading-snug">{question.prompt}</h3>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-xs text-neutral">Tests: {question.theme}</p>
            <span className="text-xs text-neutral">&middot; choose 1 or 2</span>
          </div>
        </div>

        <div className="space-y-2.5">
          {question.options.map((opt, i) => {
            const isPicked = pickedTags.includes(opt.tag);
            const atCap = pickedTags.length >= MAX_PICKS_PER_QUESTION && !isPicked;
            return (
              <button
                key={i}
                type="button"
                onClick={() => toggle(opt.tag)}
                disabled={atCap}
                className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-md border transition-colors ${
                  isPicked
                    ? "border-accent bg-accent/10"
                    : atCap
                      ? "border-transparent bg-black/[0.03] opacity-40 cursor-not-allowed"
                      : "border-transparent bg-black/[0.03] hover:border-accent/50"
                }`}
              >
                <span
                  className={`font-code text-xs w-5 h-5 rounded-sm border flex items-center justify-center shrink-0 mt-0.5 ${
                    isPicked ? "bg-accent border-accent text-white" : "border-rule text-neutral"
                  }`}
                >
                  {isPicked ? <Check className="w-3 h-3" /> : OPTION_LETTERS[i]}
                </span>
                <span className="text-sm">{opt.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-auto pt-2">
          <button
            type="button"
            onClick={goBack}
            disabled={current === 0}
            className="text-sm font-medium text-neutral hover:text-ink disabled:opacity-40 disabled:hover:text-neutral transition-colors"
          >
            &larr; Back
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={pickedTags.length === 0}
            className="text-sm font-medium px-5 py-2 rounded-xs bg-charcoal text-white hover:bg-ink transition-colors disabled:opacity-40"
          >
            {current === QUIZ_QUESTIONS.length - 1 ? "See the profile" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
