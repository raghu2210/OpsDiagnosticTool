/**
 * Single source of truth for the Workflow page's static content - shared between the page
 * (app/workflow/page.tsx, rendered as JSX) and the Workflow PDF export
 * (app/api/workflow/pdf/route.ts, rendered via lib/pdf/WorkflowReport.tsx as plain text).
 * Section bodies are plain string arrays (one paragraph per string) rather than JSX so the
 * exact same content can drive both renderers without duplicating the copy.
 */
export const APP_VERSION = "3.6";
export const APP_UPDATED = "2026-08-07";

export const FLOW_STEPS = ["Data layer", "Pick areas", "Score & diagnose", "Outputs"];

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
    title: "2 - Score & Diagnose",
    body: [
      "Pick a module and one or more areas on the Diagnose page. From there: score directly in-app, upload a filled checklist (parsed by lib/xlsx/parse-checklist.ts), or export the same selection as a fillable workbook (lib/xlsx/build-checklist.ts) for an auditor to fill in on the ground and upload back later - all three share the one module/area selection instead of living on separate pages.",
      "computeDiagnostic() produces a weighted maturity score per area and module, plus the exact tasks needed to reach the next level, ranked by weighted impact (low score x high weight first). Results can be exported as a branded PDF.",
    ],
  },
  {
    title: "3 - Sync Tracker",
    body: [
      "A read-only mirror of a hand-maintained Google Sheet (GOOGLE_TRACKER_SHEET_ID). Uses the Sheets API with hyperlink-preserving fields when credentials are configured, otherwise the sheet's published CSV (auth-free, but strips rich hyperlinks - bare URLs pasted into cells are still auto-linkified). Sub-items (Sr No like 2.1) nest under their parent row (2) as an expandable group. Re-reads on a 60s cache; the Refresh button forces an immediate re-fetch.",
    ],
  },
];

export const CHANGELOG = [
  {
    version: "3.6",
    date: "2026-08-07",
    body: "Added a KB Tracker dataset: sample_data/Knowledge_base_updated.xlsx gains a new 'KB Tracker' sheet (module_id, area_id, area_name, subpoint_id, subpoint_name, review_status) tracking content-authoring status per sub-point - Closed / Needs review / Pending - entirely separate from the Master sheet, same principle as the Sync Tracker's data being wholly separate from Masters/Recommendations. Populated one-time from a color-coded reference copy of the workbook (cell fill color -> status, matched by subpoint_id: 32 Closed, 27 Needs review, 4 Pending, 63 total, 0 unmatched). scripts/generate-fallback-json.mjs extended to read this sheet (optional, defaults to [] like Problems) into lib/data/local-fallback/kb-tracker.json, and lib/data/masters-source.ts gains loadKbTracker() following the same Google-Sheet-if-configured-else-local-fallback pattern as loadMasters()/loadProblems().",
  },
  {
    version: "3.5",
    date: "2026-08-06",
    body: "Updated the knowledge base Master data via a newly provided Excel file (Knowledge_base_updated.xlsx), modifying the fallback generation script to cleanly read from sample_data/Knowledge_base_updated.xlsx and look for the 'Master' sheet instead of 'Masters'.",
  },
  {
    version: "3.4",
    date: "2026-07-21",
    body: "Folded the standalone 'Build a Checklist' page (/build) into Diagnose. Both pages started with the identical module/area-selection step and only diverged in what you did with the selection - Build only ever produced a blank .xlsx, which is now available as an 'Export checklist for offline use' button directly inside Diagnose's 'Score in-app' tab, scoped to whatever areas are currently selected there. The workflow is now one page with three ways to get scores in (score in-app, export-then-upload, or upload a checklist filled elsewhere) instead of two pages each owning half the flow. No scoring/rollup logic changed - buildChecklistXlsx()/parseChecklistXlsx() and computeDiagnostic() are untouched; this is a page-structure and navigation change. Workflow page's own step list updated to match (was 4 steps including a standalone 'Build a Checklist' step, now 3).",
  },
  {
    version: "3.3",
    date: "2026-07-21",
    body: "Rebalanced the 7-area structure from v3.2 into 10 areas, fixing two categorization errors and one mega-area problem found on a fresh critical review: (1) Demand Forecasting, Dark Store Replenishment Cadence, and Stockout & Overstock Balance were left under 'Fulfillment Operations' even though they're planning decisions, not execution - moved to 'Planning & Sourcing'. (2) Temperature Monitoring, Zone Segregation, and Humidity/Ventilation Control were left under 'Inbound & Quality' even though cold chain is an ongoing storage condition, not a receiving-time activity - split into a new 'Cold Chain & Perishability' area. (3) The old 'Governance & Performance' area had swallowed 13 sub-points (more than double every other area), diluting Safety & Compliance to roughly 1.8% effective module weight - split into 'Control Tower & Metrics', 'Safety, Compliance & Risk', and 'Cost & Scalability', with 3PL/Contractor Compliance folded into 'People & Training' instead (a workforce-governance topic, not facility/safety). Every area now sits in the 4-9 sub-point range instead of 4-13. Also added 10 new sub-points closing real gaps: New SKU/Vendor Onboarding Process, Cold-Chain Power Backup & Continuity, Space/Capacity Utilization Tracking, Packaging Sustainability, Security & Theft Prevention, Food Safety & Hygiene Compliance, Regulatory Licensing & Documentation, Facility Infrastructure & Upkeep, Insurance & Business Continuity, and WMS/Tech System Maturity - 20 new Node-4 problem statements with full 5-level descriptions (139 total problems, 67 total sub-points). Existing content's weight was rescaled by a flat x0.88 factor to free 12% of the module for the new sub-points, with the same global-weight-preserving math as v3.2's collapse (verified: zero content lost, all weight sums check out, computeDiagnostic() runs correctly end to end). Built via scripts/restructure-10-areas.mjs - caught and fixed a real bug during verification where a newly-generated problem ID collided with an old problem ID also being renamed in the same pass, corrupting a recommendation row; fixed by renaming existing rows before adding new ones rather than after.",
  },
  {
    version: "3.2",
    date: "2026-07-21",
    body: "Restructured the FnV Warehouse Diagnostic's area hierarchy: the 7 area-picker categories (Planning & Sourcing, Inbound & Quality, Storage & Inventory, Fulfillment Operations, Loss/Returns & Complaints, Governance & Performance, People & Training) are now the actual Node-2 areas (A1-A7), and the previous 24 areas are re-parented as Node-3 sub-points directly under them - zero content lost. The old 'Area' level never carried its own maturity descriptions (only a name and a weight, aggregated from its sub-point rows), so each old area's sub-points were individually re-IDed and re-parented rather than squeezed into a single new sub-point - all 57 sub-points and all 119 Node-4 problem statements are fully intact with their original names, weights, and 5-level descriptions unchanged. Weight math (new_area_weight = sum of constituent old area_weight values; new_subpoint_weight = old_area_weight * old_subpoint_weight / new_area_weight) preserves every sub-point's global importance exactly - verified with a real end-to-end computeDiagnostic() run using a varied, non-uniform score set that the module score is bit-for-bit identical before and after the migration. IDs renamed throughout Masters, Problems, and Recommendations (552 recommendation rows updated) via scripts/collapse-categories-to-areas.mjs, run against the same content pipeline as every other content change this session.",
  },
  {
    version: "3.1",
    date: "2026-07-21",
    body: "Closed real coverage gaps found comparing our 18-area diagnostic against a general 'Core WH Flow Ops + Support & Governance' framework (user-authored R&D) - not adopted as a replacement (it has no perishability lens at all - no cold chain, no spoilage, no FEFO - so our structure stays the backbone), but mined for what we were genuinely missing. Added 6 new areas (A19 Outbound Dispatch & Load Management, A20 Picking Productivity, A21 Packing Operations, A22 Warehouse Safety & Compliance, A23 Third-Party Labor & Outsourced Operations Governance, A24 SKU Expansion & Scalability Readiness) and 4 new sub-points folded into existing areas (A1.4 Weighment Accuracy & Calibration, A9.3 Handling Steps & Touch Minimization, A16.3 Cross-Utilization & Skill Matrix, A18.3 Labor Cost Ratio & Utility Cost Discipline) - 16 new sub-points, 32 new problem statements (119 total), 128 new recommendation rows, all Node-4 scored with full 5-level maturity descriptions. Existing A1-A18 area_weight rescaled by a flat x0.82 factor (exact proportional scaling, frees 18% of the module's weight for the 6 new areas); the 4 areas gaining a sub-point had their internal subpoint_weight rebalanced to include it. Pure content/data extension via scripts/seed-spread-expansion.mjs -> sample_data/LongArc_Masters.xlsx -> regenerated JSON fallback - no scoring/rollup code changed. Verified end to end: all 24 areas' weights sum to exactly 1.0, every sub-point/problem weight sums to 1.0 within its parent, computeDiagnostic() correctly rolls up all 24 areas to a module score, and all 119 problems resolve non-empty recommendation text when scored below target.",
  },
  {
    version: "3.0",
    date: "2026-07-20",
    body: "Expanded the FnV Warehouse Diagnostic from 7 to 18 areas, incorporating the broader 'Fresh Operating System' operational framework (slot scheduling, vendor/CC operations, warehouse flow, rejection/returns/complaints handling, control tower, market intelligence, training, people, metrics & visibility, cost diagnostics) rather than warehouse-floor activity alone. 11 new areas (A8-A18), 22 new sub-points, 87 total problem statements (44 new, each with its own 5-level maturity description and Node-4 scoring, same as the existing A1-A7 areas), 176 new recommendation rows. Existing A1-A7 area_weight values were rebalanced (summing to 0.55 instead of 1.0) so all 18 areas' weights sum to 1.0 together - no sub-point or problem weight within any existing area changed, so previously-recorded relative scores within A1-A7 are unaffected. Pure content/data extension via a new seed script (scripts/seed-a8-a18-areas.mjs -> sample_data/LongArc_Masters.xlsx -> regenerated JSON fallback) - no code changed, since computeDiagnostic(), ScoreForm.tsx, BuildFlow.tsx, ResultsReveal.tsx, and DiagnosticReport.tsx already handle any number of areas/sub-points/problems generically. Verified end to end: all 18 areas' weights sum to 1.0, every sub-point's problem weights sum to 1.0, computeDiagnostic() correctly rolls up scores across all 18 areas to a module score, and all 44 new problem statements resolve non-empty recommendation text when scored below target.",
  },
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
