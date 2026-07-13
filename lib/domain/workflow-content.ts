/**
 * Single source of truth for the Workflow page's static content - shared between the page
 * (app/workflow/page.tsx, rendered as JSX) and the Workflow PDF export
 * (app/api/workflow/pdf/route.ts, rendered via lib/pdf/WorkflowReport.tsx as plain text).
 * Section bodies are plain string arrays (one paragraph per string) rather than JSX so the
 * exact same content can drive both renderers without duplicating the copy.
 */
export const APP_VERSION = "2.4";
export const APP_UPDATED = "2026-07-13";

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
