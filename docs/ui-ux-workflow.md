# UI/UX & Data Flow

Tracker item 2.1 (Diagnostic Tool, owner Raghu): **"Document - How to capture UI/UX
workflows."** This documents the actual UI/UX built for `web/`: navigation chrome, where
each screen's data comes from, what the user does on it step by step, every
loading/empty/error state, and where the data goes next - grounded in the real source
files, not a generic sitemap.

A visual companion diagram covering the same ground (navigation + data flow in one
picture) is at **`docs/ui-ux-flow.drawio`** - open it at
[diagrams.net](https://app.diagrams.net) (File -> Open From -> Device) or the draw.io
VS Code extension.

## Navigation (global chrome, every page)

- **`TopNav`** (`components/nav/TopNav.tsx`) - a sticky, floating glassmorphic pill
  (`position: sticky; top: 1rem`), not a full-width bar. Rendered once in `app/layout.tsx`
  so it's present unchanged across all five routes rather than each page owning its own
  header.
  - **Brand mark:** `longarc-logo.png`, a self-contained wordmark image (the "LongArc"
    text is baked into the PNG) rendered at its native ~2.81:1 aspect ratio - there is no
    separate text label next to it.
  - **Links:** Home (`/`), Checklist (`/build`), Diagnose (`/diagnose`), Tracker
    (`/tracker`), Workflow (`/workflow`) - rendered from a single `NAV` array, so adding a
    page means adding one array entry, not touching markup in multiple places.
  - **Active state:** `usePathname()` compares against each link's `href` (`pathname ===
    "/"` for Home, `pathname.startsWith(href)` for everything else, so a future
    `/build/:id`-style sub-route would still highlight "Checklist"). Active link:
    solid charcoal pill, white text. Inactive: neutral text, `hover:text-accent` +
    a faint hover background - accent is used here purely as interaction chrome, never as
    a status color (see the design skill's color rules).
- **`Footer`** (`components/nav/Footer.tsx`) - static, non-interactive except two
  `mailto:` / external links, also accent-on-hover. No data, no navigation logic.
- There is no secondary/side navigation anywhere in the app - see the top-nav-vs-side-nav
  reasoning already covered in this conversation's design review (flat 5-page structure,
  wide data tables need the horizontal room a side rail would take).

## The shared data layer

Two independent data sources feed every screen. Both follow the same pattern: try Google
Sheets first, fall back to a bundled local snapshot so the app runs with zero setup.

| Source | File | Sheet(s) | Fallback |
|---|---|---|---|
| **Masters + Recommendations** | `lib/data/masters-source.ts` | `Masters`, `Recommendations` (env `GOOGLE_SHEET_ID`) | `lib/data/local-fallback/masters.json` / `recommendations.json` |
| **Sync Tracker** | `lib/data/tracker-source.ts` | `Tracker` (env `GOOGLE_TRACKER_SHEET_ID`, else a fixed default sheet ID) | The sheet's own published CSV (auth-free; strips rich hyperlinks, recovered via `linkify()`) |

Every row from either source is run through `normalizeDashesDeep()`
(`lib/domain/normalize.ts`) on load, so any Unicode dash (em/en/minus) becomes a plain
`-` regardless of which source produced it. `loadMasters()` returns **all** rows
(active and inactive); every page that consumes it filters `status === "active"` itself -
this mirrors the original Python app's `masters[masters["status"] == "active"]` filter and
is intentionally not baked into the loader, so a future admin view could show inactive
rows without a second loader.

`Masters` is the one-row-per-sub-point table: `module_id`, `module_name`, `area_id`,
`area_name`, `area_weight`, `subpoint_id`, `subpoint_name`, `subpoint_weight`, plus five
score-level description columns. `Recommendations` is editable and maps
`(module_id, subpoint_id, target_level) -> recommended_tasks` text.

Two more read-only JSON endpoints exist but are **not called by any page today** -
`GET /api/masters` (active-filtered Masters) and `GET /api/recommendations` (raw
Recommendations). They exist as a public read surface over the same loaders, available
for external consumption if something outside this app ever needs the same data.

## Screen-by-screen flow

### Home (`/`)

- **Data in:** none live - static marketing/orientation content (`Hero`, `HowItWorks`,
  `MaturityLadder`, `ModuleLedger`). `ModuleLedger` reads a summary of the same Masters
  data other pages use, to show real module names rather than placeholder copy.
- **User does:** reads, clicks through to one of the four functional pages via `TopNav`.
- **Data out:** none - pure entry point.
- **States:** no loading/empty/error states - everything here is server-rendered from
  data that's either present or a static fallback; nothing here can be "empty."

### Build a Checklist (`/build`)

- **Data in:** `app/build/page.tsx` (server component) calls `loadMasters()`, filters to
  `status === "active"`, passes the full active row set into `BuildFlow` (client
  component).
- **User does, in order:**
  1. Picks a **Module** from a `<select>` (`listModules()` derives the option list from
     the loaded rows - not a separate lookup).
  2. `groupByArea()` groups that module's rows into **Areas**, rendered as toggle cards.
     The user taps one or more Area cards; selection state (`Set<string>` of `area_id`)
     lives entirely client-side in `BuildFlow`. `Select all` / `Clear` buttons operate on
     the same state.
  3. Either downloads the **full module** checklist immediately, or - once at least one
     Area is selected - a **Checklist** section reveals below showing the combined
     sub-point table, and downloads a **combined checklist** scoped to just the selected
     Areas.
- **Data out:** the selected rows (full module or combined-Areas subset) are POSTed as
  JSON to `POST /api/checklist/export`, which calls `buildChecklistXlsx()`
  (`lib/xlsx/build-checklist.ts`) and streams back an `.xlsx` file - one row per
  sub-point, with its five score-level descriptions and **blank** Score/Observation
  columns for an auditor to fill in on the ground. This file is the literal template that
  later gets fed back into Diagnose's "Upload filled checklist" path.
- **States:**
  - *Loading:* both download buttons swap their label to "Generating..." and show a
    spinning `Loader2` icon while `handleDownload()` awaits the export request; both
    buttons are `disabled` for the duration so a second click can't fire a second export.
  - *Empty:* before any Area is selected, the Checklist section is replaced by a dashed
    placeholder box ("Select at least one Area above to generate its checklist"),
    visually matching the same dashed-border pattern used for Diagnose's upload dropzone.
  - *Error:* `downloadChecklist()` throws on a non-OK response; `handleDownload()` catches
    it and shows a red error line next to whichever button (full/combined) triggered it.

### Score & Diagnose (`/diagnose`)

- **Data in:** `loadMasters()` + `loadRecommendations()`, both active-filtered, passed
  into `DiagnoseFlow`. Same Module `<select>` / `groupByArea()` pattern as Build - the two
  pages share `lib/domain/grouping.ts` rather than duplicating the grouping logic.
  Switching modules resets any in-progress diagnostic (`setDiag(null)`).
- **Two mutually exclusive input modes** (tab switch, `mode` state in `DiagnoseFlow`,
  underlined-tab UI - accent underline on the active tab):
  - **Upload filled checklist** (`UploadChecklist.tsx`): the auditor drops in the `.xlsx`
    that Build produced (now filled with scores). The file is sent to
    `POST /api/checklist/parse`, which runs server-side (Node runtime, since `exceljs`
    needs Node APIs) via `parseChecklistXlsx()` (`lib/xlsx/parse-checklist.ts`) and
    returns parsed `SubpointScore[]` JSON; `toScoreMaps()` (`lib/domain/scoring.ts`) then
    splits that into a `scores` Map and an `observations` Map client-side.
  - **Score in-app** (`ScoreForm.tsx`): the same Area/sub-point list rendered as an
    interactive form (`SegmentedScore` 1-5 picker + a free-text observation input per
    row); submitting builds the same `{scores, observations}` shape directly, no file or
    server round-trip involved.
- **Both modes converge** on one function: `computeDiagnostic(moduleRows, scores,
  observations, recommendations)` (`lib/domain/scoring.ts`) - ported 1:1 from the
  original Python `compute_diagnostic()`. For every **scored** sub-point (unscored ones
  are excluded from every average, matching the original `between(1,5)` filter) it
  computes: the next target level, a weighted gap (`(5 - score) * subpoint_weight *
  area_weight`), and looks up the prescriptive task text for that specific
  `(module, subpoint, target_level)` triple from the Recommendations map.
- **Result (`DiagnosticResult`)** flows into `ResultsReveal.tsx`: an animated score ring
  (`ScoreDial`, framer-motion count-up + color transition across score bands), per-area
  maturity bars, and a priority-action list ranked by weighted gap (worst gap first) -
  this ranking is the actual point of the whole page: not just "what's your score" but
  "what to fix first."
- **Data out (optional):** `diag` + `moduleName` POSTed to `POST /api/diagnostic/report`,
  rendered server-side via `@react-pdf/renderer` (`DiagnosticReport.tsx`) into a branded
  PDF download - the shareable artifact of a completed audit. The download button only
  appears once `diag.n_scored > 0` - an unscored/empty diagnostic has nothing to export.
- **States:**
  - *Upload loading:* the dropzone label stays static, but a `Reading file...` line
    appears below it (`status.kind === "loading"`).
  - *Upload success:* a green confirmation line - `Read N scored sub-point(s) from the
    file.`
  - *Upload error:* a red line surfacing the server's error message verbatim (bad file
    format, unparseable workbook, etc.) - `UploadChecklist` is the one place in the app
    with an explicit, visible error state.
  - *PDF loading:* "Generating..." label swap + spinning `Loader2` icon on the download
    button, matching Build's buttons.
  - *PDF error:* a failed report generation shows a red error line above the results,
    right-aligned under the download button.
  - *Empty:* the entire "Diagnostic" section (score ring, priority list, download button)
    is conditionally rendered only once `diag` is non-null - before either mode produces
    a result, nothing below the input tabs exists at all.

### Sync Tracker (`/tracker`)

- **Data in:** `app/tracker/page.tsx` calls `loadTracker()` server-side for the initial
  render (`export const revalidate = 60` - Next.js re-runs this on a 60s cache window),
  then hands `initialRows` to the client `TrackerTable`.
- **User does:** reads a hand-maintained project-tracking sheet (not editable from this
  app - see "What this app does not do," below). Rows whose `Sr No` has a decimal
  (`2.1`) are grouped under their integer parent (`2`) as an expandable group
  (`groupRows()`, toggled by clicking the summary row - a rotating chevron, tinted accent
  since it's an interactive chrome element); everything else renders flat. Clicking
  **Refresh** (`GET /api/tracker` -> `loadTracker()` again) force-fetches past the 60s
  cache without a full page reload.
- **Data out:** none - this page is read-only by design. The single source of truth for
  this data is the Google Sheet itself, edited by hand outside the app.
- **States:**
  - *Loading:* the Refresh button's icon spins (`animate-spin` on the `RefreshCw` icon)
    for the duration of the re-fetch; the button is `disabled` meanwhile.
  - *Empty:* if `loadTracker()` returns zero rows, the whole table is replaced by a
    standalone Refresh button plus "No tracker rows found - check the sheet
    configuration." - the one explicit "something's probably misconfigured" message in
    the app.
  - *Error:* a non-OK response or a thrown network error both surface a red line
    ("Couldn't refresh the tracker - showing the last loaded data.") under the Refresh
    button; the previously loaded rows stay visible rather than being cleared.

### Workflow (`/workflow`)

- **Data in:** `loadMasters()` + `loadRecommendations()`, used only to compute live
  counts (`nModules`, `nAreas`, `nPoints`, `nRecos`) shown in the stat strip - plus static
  content from `lib/domain/workflow-content.ts` (flow steps, section prose, changelog).
- **User does:** reads the living documentation of the whole app - this is the page that
  is supposed to describe every other page's flow, updated on every workflow change per
  the project's standing rule. Sections are `<details>` accordions, open by default;
  the changelog is a flat, newest-first list.
- **Data out:** two independent PDF exports (`GET /api/workflow/pdf`,
  `GET /api/changelog/pdf`) - kept as two separate documents/routes/components
  deliberately, mirroring the original Python app's convention, after an earlier version
  of this port wrongly merged them into one PDF.
- **States:** no loading/empty/error states - both download links are plain anchor tags
  (`<a href="/api/...">`), so the browser's own download UI handles progress; there's no
  client-side fetch/loading state to manage here the way Build and Diagnose's
  `fetch`-then-`blob()` downloads need.

## The two loops that share one data layer

Build and Diagnose are the two operating loops referenced in the Workflow page's own
copy - both start from the same Masters rows, but diverge immediately:

```
                         loadMasters() (active rows)
                                   |
                +------------------+------------------+
                |                                     |
             Build                                Diagnose
                |                                     |
     pick Module -> pick Area(s)          pick Module -> upload OR score in-app
                |                                     |
     POST /api/checklist/export        upload: POST /api/checklist/parse -> toScoreMaps()
                |                        form:  ScoreForm submit -> {scores, observations}
        blank .xlsx checklist                          |
      (Score/Observation columns              computeDiagnostic()
              empty)                                   |
                |                    scored DiagnosticResult -> ResultsReveal
                |                                       |
                |                             POST /api/diagnostic/report
                |                                       |
                +----> auditor fills in ---->+   branded PDF download
                       on the ground
```

The checklist produced by Build is the literal input document that later gets uploaded
back into Diagnose's "Upload filled checklist" mode - the two pages are not just
thematically related, they're two ends of the same physical document's lifecycle. This
loop, plus every page's navigation and data-in/out edges, is also drawn visually in
`docs/ui-ux-flow.drawio`.

## Gaps found and fixed

Both gaps originally flagged in this doc have since been closed:

- **Silent failure on export/refresh errors** - Build's checklist download, Diagnose's
  PDF download, and Tracker's refresh now all surface a visible red error message on
  failure instead of just clearing the loading state. `UploadChecklist`'s existing
  error UI was the pattern the other three were normalized to.
- **Inconsistent loading affordance** - Diagnose's PDF download button now shows the
  same spinning `Loader2` icon Build's buttons already had, not just the text swap.

## What this app does not do

- It does not write back to Masters, Recommendations, or the Tracker sheet. Every data
  flow above is either read-only (Tracker, and Masters/Recommendations as consumed by
  Build/Diagnose) or produces a downloadable file (`.xlsx` checklist, diagnostic PDF,
  workflow/changelog PDFs) - never a write back to the source of truth.
- Editing Recommendations or Masters happens by hand in the Google Sheet, outside this
  app, exactly like the Sync Tracker.
