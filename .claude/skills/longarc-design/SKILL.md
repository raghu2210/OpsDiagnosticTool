---
name: longarc-design
description: LongArc Diagnostic Tool's actual design system - typography, color, spacing, radius, and motion rules established for this project. Reference before adding or changing any UI.
---

# LongArc Design System

This captures the design system already built for this app (not a generic starter) - reference
it before adding new UI so new work stays consistent instead of drifting toward generic
Tailwind/SaaS defaults.

## Typography

Two typefaces:

- **Display + Body/UI (`font-display` and default sans, both `--font-body` /
  `--font-display` in `globals.css`)**: Helvetica Neue, by explicit request - replaced the
  earlier Fraunces (display serif) + Inter (body) pairing. It's a plain CSS system-font
  stack (`"Helvetica Neue", Helvetica, Arial, sans-serif`), not loaded via `next/font/google`,
  because Helvetica Neue is an Apple/Linotype-licensed system font, not a distributable
  webfont - it renders as the real thing on macOS/iOS and falls back to Arial elsewhere
  (metrically near-identical, ships by default on Windows). Used for headlines, page titles,
  module names, the big score number, body copy, buttons, labels, tables. Tabular figures
  matter here since scores/weights/percentages appear constantly in tables and need to align
  (`font-variant-numeric: tabular-nums` is set globally).
- **Code/structural (`font-code` / `--font-plex-mono`)**: IBM Plex Mono, used sparingly for
  actual codes - module/area/subpoint IDs (`WH_V1`, `A1.1`), Sr Nos, dates. Not for general UI.
  Unchanged by the Helvetica Neue switch.

## Color

A deliberately small, desaturated semantic palette (`app/globals.css` `:root`, mirrored in
`styles/tokens.ts` for non-CSS contexts like PDF generation), plus one brand accent. Still no
gradients and no generic purple/blue "AI" hue - the accent below was chosen because it's grounded
(rust/terracotta - industrial, logistics, warehouse-adjacent), not because bright color was
missing.

- `--ink` #242424, `--charcoal` #3a3a3a - brand ink/surface (headers, primary buttons)
- `--paper` #f3efe6 - warm cream page background. (Was #fafaf8 - only ~2% off pure white, so it
  read as plain white on screen despite the token name; deepened to an actually-visible tone,
  plus a subtle feTurbulence grain texture on `body` in `globals.css` for tactile depth without
  a shadow or gradient.) `--surface` #fbf9f4 is a shade lighter, used on cards/panels/tables so
  they float gently above the page instead of the whole app being one flat plane held together
  by borders alone.
- `--rule` #e4e2dd - warm-grey hairline border, not cool grey
- `--neutral` #6b6b6b - secondary text
- `--accent` #a8532e / `--accent-soft` #c0754f - the ONE brand accent, reserved strictly for
  chrome/interaction: focus rings, nav hover/active touches, link hover, selected-state borders
  (e.g. Build page's selected-area cards). **Never** use it for scoring/status semantics - that
  stays on the bands below, so the two systems can't collide in meaning.
- `--red` #9c4a3d / `--amber` #8a6a2a / `--amber-soft` #a66a3a / `--blue` #3e5c7a /
  `--green` #3f6b52 / `--green-soft` #4f7d5e - the ONE shared semantic set used for both Sync
  Tracker status and diagnostic score bands (`lib/domain/bands.ts`). Don't invent a second
  color system for a new feature - map it onto these bands.

## Spacing & radius

- Spacing: 4px base scale (4, 8, 12, 16, 24, 32, 48, 64, 96, 128). Generous jumps at the top end
  are used deliberately for section padding (`py-20` etc.) - don't cram sections tight.
- Radius: small and sharp everywhere (`--radius-xs` 4px, `--radius-sm` 6px, `--radius-md` 8px).
  **Exception**: `--radius-lg` (28px) exists for exactly one thing - the Home hero card. A
  "rounded-lg-everywhere" look is a generic-AI-template tell; one large intentional radius on a
  real centerpiece reads as a considered choice instead.
- Prefer a 1px `--rule` border over drop shadows for most cards. Reserve subtle shadows for
  genuinely floating elements (the glassmorphic nav, dropdowns).

## Motion

Framer Motion is already installed and used - `components/motion/Reveal.tsx` is the shared
fade-up entrance wrapper. Rules that came out of real back-and-forth on this project:

- Animate only what's actually first-view/occasional content, or a genuine data interaction
  (the score-counting dial, the area-maturity bar fills). Don't add motion to things seen
  repeatedly/every session, per the "should this animate at all?" frequency test.
- Stagger delays via explicit per-item values (index * N), not automatic sibling detection -
  components can live in separate layout contexts (columns, grids) where CSS-sibling tricks or
  shared keyframe/`times` arrays get fragile. Keep timing math simple and per-element.
- `-webkit-text-stroke` is NOT a safe way to fake an "outline number" - it's unsupported in
  Firefox and renders invisible (transparent fill, no stroke fallback there). Use a solid
  low-opacity fill instead ("ghost number" pattern in `HowItWorks.tsx`).
- Respect `prefers-reduced-motion` - already handled globally in `app/globals.css`.

## Anti-patterns for this project specifically

Things already tried and explicitly reverted or rejected in this codebase - don't reintroduce
without a real reason:

- No emoji as icons/markers anywhere (use lucide-react icons or the mono-code label style).
- No borrowed third-party brand names, stock video URLs, investor logos, or star-rating badges -
  this is an internal operations tool, not a consumer/fintech marketing site. Any "marquee" or
  social-proof-shaped element must use real, tool-specific content (e.g. the domains it audits),
  not filler.
- No generic pre-built component-library drops (e.g. copy-pasted from a UI marketplace) reskinned
  with our colors - build bespoke, grounded in this tool's actual content and flows. This was an
  explicit direction call on this project, not an oversight.
- Numbered markers (01/02/03 style) are only appropriate where content is a genuine sequence
  (the "How it works" steps, the Workflow PDF's flow list) - not decoration for an unordered list.
