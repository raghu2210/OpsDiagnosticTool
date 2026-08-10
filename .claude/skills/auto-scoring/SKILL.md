---
name: auto-scoring
description: How observation-driven auto-scoring and score rationales work in the Diagnose flow (ScoreForm + /api/diagnostic/auto-score). Reference before touching scoring, observations, or the rubric fields on MasterRow/ProblemRow.
---

# Auto-scoring from observations

Two features, built back to back, that turn the free-text "Observation" field on each
checklist row into an automatic 1-5 score plus a one-line explanation - reference this before
changing anything in the scoring path (`ScoreForm.tsx`, the auto-score route, or the
`score_1_desc`..`score_5_desc` rubric fields).

## Feature 1: auto-score on blur

Previously, `Observation (optional)` was purely descriptive text and the reviewer always
picked the 1-5 score manually via `SegmentedScore`. Now, when the reviewer blurs the
observation textarea, `ScoreForm.tsx` sends `{ observation, score_1_desc..score_5_desc }` to
`POST /api/diagnostic/auto-score`, which calls Groq (free-tier, OpenAI-compatible chat
completions API) and asks it to classify the observation against that row's own 5-level
rubric text - the same `score_N_desc` fields already in `MasterRow`/`ProblemRow`
(`lib/domain/types.ts`), sourced from `lib/data/local-fallback/masters.json` /
`problems.json`. The returned score is written into the exact same `values` state a manual
click would set, so `computeDiagnostic()`, the live rollup, and PDF export all needed zero
changes.

Key behaviors, all deliberate:
- **Silent auto-fill, not a suggestion panel.** The score control just updates, same as a
  manual click - no separate "AI suggested" visual state or confirm step.
- **Trigger is blur, not keystroke-by-keystroke or a button.** Avoids re-firing the request on
  every character typed.
- **Fails silently everywhere.** No `GROQ_API_KEY` set, observation too short
  (`MIN_OBSERVATION_LENGTH`), network error, bad JSON from the model - all just return
  `{ score: null }` and the manual scoring path is untouched. Never blocks typing or
  submission.
- **`lastAutoScored` ref dedupes calls** per row id, so blurring an unchanged field doesn't
  re-fire.
- **Manual override always wins** - clicking a `SegmentedScore` button after auto-fill works
  exactly as it did before; it's the same `onScoreChange` codepath.

Files: `app/api/diagnostic/auto-score/route.ts` (new route), `components/diagnose/ScoreForm.tsx`
(`fetchAutoScore`, `handleObsBlur`), `.env.example`/`.env.local` (`GROQ_API_KEY`).

## Feature 2: score rationale ("Why N: ...")

Immediately after shipping (1), the follow-up ask was: the reviewer should see *why* a score
landed where it did, not just the number. The Groq prompt now returns
`{ score, rationale }` instead of just `{ score }` - `rationale` is one short sentence
written to the reviewer, citing the specific evidence in *their* observation that matched (or
missed) that level's rubric criteria, not a restatement of the rubric text itself.

The rationale renders as a small note directly under the observation/photo-attach block
(`ScoreRationale` in `ScoreForm.tsx`): `font-code` label ("Why 1:") + `text-neutral` sentence,
left border in `--rule` - no color-coding, no icon, no emoji, consistent with
[[longarc-design]]'s "no second color system" and "no emoji as markers" rules. It is **not**
persisted as its own field anywhere (not in `SubpointScore`/`ScoredSubpoint`, not exported to
PDF) - it's a live-editing aid, not part of the diagnostic record.

Staleness handling - the rationale is deliberately short-lived, cleared via a `rationales`
state map keyed by row id:
- Cleared the moment the observation text is edited further (`handleObsChange`) - an old
  rationale no longer describes new text.
- Cleared the moment the score is changed manually (`handleScoreChange`) - an old rationale no
  longer describes the (now different) score.
- Only (re)set together with the score itself, inside `handleObsBlur`'s auto-score success
  path - score and rationale can never point at different observations.

## If extending this further

- The rubric text (`score_1_desc`..`score_5_desc`) is the single source of truth for both
  scoring and rationale - don't hardcode a second description of what each level means
  anywhere else.
- If a future change needs the rationale to survive submission (e.g. show up in the PDF
  report), that's a real data-model change: add a field to `ScoredSubpoint`/`ScoredProblem`
  in `lib/domain/types.ts` and thread it through `computeDiagnostic()` - don't bolt it onto
  the existing session-only `rationales` state.
- This app has no LLM infra beyond this one route - if adding another AI-assisted feature,
  reuse the same Groq-via-`fetch` pattern (no SDK dependency) rather than introducing a new
  provider/SDK.
