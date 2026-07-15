/**
 * Single source of truth for the Workflow page's static content - shared between the page
 * (app/workflow/page.tsx, rendered as JSX) and the Workflow PDF export
 * (app/api/workflow/pdf/route.ts, rendered via lib/pdf/WorkflowReport.tsx as plain text).
 * Section bodies are plain string arrays (one paragraph per string) rather than JSX so the
 * exact same content can drive both renderers without duplicating the copy.
 */
export const APP_VERSION = "2.9";
export const APP_UPDATED = "2026-07-15";

export const FLOW_STEPS = ["Data layer", "Build checklist", "Auditor fills", "Score & diagnose", "Outputs"];

export const WORKFLOW_SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1 - Data layer",
    body: [
      "Source of truth: a Google Sheet (via the googleapis package + a service-account JWT) if GOOGLE_SHEET_ID and credentials are configured; otherwise the bundled local JSON fallback generated from sample_data/LongArc_Masters.xlsx - no setup needed.",
      'Only rows with status === "active" are shown. normalizeDashesDeep() runs on every load - any Unicode dash (em/en/minus) becomes a plain -, regardless of source.',
      "Two sheets: Masters (one row per sub-point) and Recommendations (editable; one row per module, sub-point, target level).",
    ],
  },
  {
    title: "2 - Build a Checklist",
    body: [
      "Pick a module and one or more areas; the selection combines into a single fillable workbook via lib/xlsx/build-checklist.ts. Each row carries the sub-point, its five score-level descriptions, and blank Score / Observation columns for the auditor to fill on the ground.",
    ],
  },
  {
    title: "3 - Score & Diagnose",
    body: [
      "Either upload a filled checklist (parsed by lib/xlsx/parse-checklist.ts) or score directly in-app. computeDiagnostic() produces a weighted maturity score per area and module, plus the exact tasks needed to reach the next level, ranked by weighted impact (low score x high weight first). Results can be exported as a branded PDF.",
    ],
  },
  {
    title: "4 - Sync Tracker",
    body: [
      "A read-only mirror of a hand-maintained Google Sheet (GOOGLE_TRACKER_SHEET_ID). Uses the Sheets API with hyperlink-preserving fields when credentials are configured, otherwise the sheet's published CSV (auth-free, but strips rich hyperlinks - bare URLs pasted into cells are still auto-linkified). Sub-items (Sr No like 2.1) nest under their parent row (2) as an expandable group. Re-reads on a 60s cache; the Refresh button forces an immediate re-fetch.",
    ],
  },
];

export const CHANGELOG = [
  {
    version: "2.9",
    date: "2026-07-15",
    body: "Full Node 4 rollout: extended from the A1 pilot (v2.7-2.8) to every remaining area - A2 through A7. All 19 sub-points in the FnV Warehouse Diagnostic now score via Node 4 problem statements; there is no longer a pilot/non-pilot split within the module. 34 new problem statements (43 total) across the 16 remaining sub-points, each with its own 5-level maturity description and weight summing to 1.0 within its sub-point - same content pipeline as A1 (scripts/seed-a2-a7-problems.mjs -> sample_data/LongArc_Masters.xlsx -> regenerated JSON fallback). This is a pure content/data extension - no code changed, since computeDiagnostic(), ScoreForm.tsx, BuildFlow.tsx, ResultsReveal.tsx, and DiagnosticReport.tsx already handle Node 4 generically per sub-point rather than hardcoding which sub-points have it. Verified end to end: scored all 43 problems, confirmed all 19 sub-points produce correct computed rollups, all 7 areas and the module score compute correctly, and every problem scored below 5 resolved a non-empty recommendation.",
  },
  {
    version: "2.8",
    date: "2026-07-15",
    body: "Extended Node 4 (problem statements, v2.7) to the offline .xlsx path so online and offline scoring stay in sync - previously only the in-app 'Score in-app' tab supported it. build_checklist_xlsx() now emits one row per problem statement (with its own problem_id/problem_name/weight/descriptions) for sub-points broken down to Node 4, instead of one row per sub-point; every other sub-point is unaffected. parseChecklistXlsx() looks for an optional problem_id column and, when present, routes that row's score into problemScores instead of scores - SubpointScore gained an optional problem_id field, and toScoreMaps() now returns {scores, problemScores, observations}. Verified with a real end-to-end round trip (export via the actual production code -> simulate an auditor filling in Score/Observation -> parse back -> compute the diagnostic): the resulting rollup scores matched the in-app path exactly (A1.1=2.300, A1.2=4.250, A1.3=1.950). Checklists exported before this change have no problem_id column and continue to parse exactly as before - fully backward compatible.",
  },
  {
    version: "2.7",
    date: "2026-07-15",
    body: "Added Node 4 (problem statements) to the diagnostic tree - piloted on Area A1 (Inward & Quality Grading) only. A1's 3 sub-points now carry 9 leaf-level problem statements (3 each) with their own 5-level maturity descriptions and weights; scoring happens at this leaf level and rolls up automatically to the sub-point score via a weighted average, the same pattern computeDiagnostic() already used for sub-point -> area -> module. Areas A2-A7 are completely untouched and continue to be scored directly. computeDiagnostic() gained optional problems/problemScores params (appended last, default empty) - the existing 4-arg golden-parity test call keeps passing unchanged, confirming this is purely additive. New Problems sheet/problems.json alongside the existing Masters/Recommendations; new Recommendations rows for A1's 9 problems are keyed by problem_id via the existing recoKey() pattern - no schema changes to Masters or Recommendations themselves. The .xlsx field checklist is deliberately untouched for this pilot: an uploaded filled checklist still supplies a direct sub-point score, which is exactly the fallback computeDiagnostic() uses when no problem-level scores are present, so nothing broke there. Priority Actions (in-app and PDF) now shows A1's specific problem statements (e.g. 'Dock Scheduling') as individually ranked line items instead of one vague sub-point entry.",
  },
  {
    version: "2.6",
    date: "2026-07-14",
    body: "Score & Diagnose: 'Score in-app' now captures an optional photo per sub-point alongside the existing observation text (capped at 250 words). computeDiagnostic() gains an optional photos param (Map<subpoint_id, base64 data URI>, defaults to empty, appended last so the existing golden-parity test call keeps working unchanged) and ScoredSubpoint gains an optional photo field. Phase 1 scope deliberately skips persistent storage: the photo is resized/compressed client-side and lives only in browser state for the session - it is never uploaded to or stored on a server. It surfaces in exactly two places: a thumbnail in the in-app Priority actions list, and embedded directly into the exported diagnostic PDF (DiagnosticReport.tsx) when present. The 'Upload filled checklist' path is unaffected - photos are only capturable via the in-app scoring form, not the .xlsx round-trip. Phase 2 (using observation + score + photo together as input to an AI-assisted recommendation layer) is a separate, not-yet-scoped follow-on.",
  },
  {
    version: "2.5",
    date: "2026-07-14",
    body: "Diagnostic content: replaced the generic 5-module Masters data (WH_V1, INV_V1, MFG_V1, PROC_V1, TRANS_V1) with a single FnV Warehouse Diagnostic module (FNV_WH_V1) - 7 areas, 19 sub-points, 76 recommendation rows, covering inward/quality grading, cold chain, put-away/slotting, FEFO/shelf-life, dark-store replenishment, pick-pack accuracy, and spoilage/wastage management. The old 5 modules are marked status=inactive (not deleted) so the data is preserved and reversible. Generated via the new scripts/seed-fnv-warehouse.mjs against sample_data/LongArc_Masters.xlsx, then regenerated into the JSON fallback via the existing generate-fallback-json.mjs pipeline - the same content pipeline the project already uses, so future edits made directly in the sheet/xlsx will flow through the same way. This is a workflow/data-schema change only; UI/UX copy changes made in the same work session are logged separately in docs/ui-ux-workflow.md per the hard rule that these two logs never mix.",
  },
  {
    version: "2.4",
    date: "2026-07-13",
    body: "Typography: display and body both switched to Helvetica Neue (system-font CSS stack, not a next/font/google webfont - it's Apple/Linotype-licensed, not distributable), replacing the Fraunces (serif)/Inter pairing. Renders as real Helvetica Neue on macOS/iOS, falls back to Arial elsewhere. IBM Plex Mono for structural codes is unchanged. PDF exports were already on react-pdf's default Helvetica core font, so this brings the web UI in line with what the PDFs already looked like.",
  },
  {
    version: "2.3",
    date: "2026-07-13",
    body: "Fixed two more gaps found via user review of the actual downloaded PDF and a fresh screenshot: (1) the Workflow PDF wrongly included the Changelog inline - app.py has always kept these as two separate exports (build_workflow_pdf excludes it, build_changelog_pdf is separate) and this port missed that. Split into lib/pdf/WorkflowReport.tsx (no changelog) + a new lib/pdf/ChangelogReport.tsx / app/api/changelog/pdf, with a 'Download changelog (PDF)' button next to the Changelog section. (2) v2.2's --surface fix (#fbf9f4) was only ~3% off --paper - still not enough contrast for cards to read as separated (confirmed via screenshot: Build page's area cards were essentially invisible). Pushed --surface to a genuinely white tone and added shadow-sm alongside every bg-surface usage, including the Build page's area-toggle cards which had no background at all in their unselected state.",
  },
  {
    version: "2.2",
    date: "2026-07-13",
    body: "Fixed two gaps found via visual review: (1) page sections had no distinct surface from the page background (only thin dividers), so content didn't read as separated - Section/StatStrip/flow-step pills/changelog rows now sit on --surface, matching the treatment already applied to Home/Build/Diagnose/Tracker cards. (2) Added the missing 'Download workflow (PDF)' export (lib/pdf/WorkflowReport.tsx, app/api/workflow/pdf) - app.py has always had this (build_workflow_pdf); it was never ported here. Also deepened --paper from #fafaf8 (only ~2% off pure white, read as plain white) to a genuinely visible warm cream, and added a subtle grain texture, across the whole app.",
  },
  {
    version: "2.1",
    date: "2026-07-13",
    body: "Phase B complete: real Build a Checklist, Sync Tracker, and Workflow pages replace the placeholders. Added lib/xlsx/build-checklist.ts (workbook export, mirrors build_checklist_excel()) and lib/data/tracker-source.ts (Sheets API with hyperlink-preserving fields, falling back to the published CSV). Introduced --accent, a rust/terracotta brand color reserved for chrome/interaction states (focus rings, nav hover, link hover, selected borders) - kept strictly separate from the red/amber/blue/green semantic set used for scoring and tracker status.",
  },
  {
    version: "2.0",
    date: "2026-07-13",
    body: "Full rewrite from Streamlit to Next.js/TypeScript/Tailwind (App Router, Framer Motion, @react-pdf/renderer) - Phase A shipped Home and Score & Diagnose. Every scoring calculation ported to TypeScript and verified bit-for-bit against the original Python logic via a golden test (scripts/golden_diagnostic.py -> tests/scoring.test.ts).",
  },
] as const;
