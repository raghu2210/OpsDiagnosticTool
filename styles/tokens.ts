/**
 * Design tokens as plain JS/TS constants, for contexts that can't read CSS custom
 * properties: @react-pdf/renderer (PDF generation) and anywhere color needs to be
 * computed/interpolated in JS (e.g. framer-motion color tweens across score bands).
 *
 * Source of truth is duplicated here and in app/globals.css's `:root` block - keep
 * both in sync if the palette changes.
 */
export const COLOR = {
  ink: "#242424",
  charcoal: "#3a3a3a",
  paper: "#f3efe6",
  surface: "#fffefb",
  rule: "#e4e2dd",
  neutral: "#6b6b6b",
  accent: "#a8532e",
  accentSoft: "#c0754f",
  red: "#9c4a3d",
  amber: "#8a6a2a",
  amberSoft: "#a66a3a",
  blue: "#3e5c7a",
  green: "#3f6b52",
  greenSoft: "#4f7d5e",
  white: "#ffffff",
} as const;

export const RADIUS = {
  xs: 4,
  sm: 6,
  md: 8,
} as const;

export const SPACE = [4, 8, 12, 16, 24, 32, 48, 64, 96, 128] as const;
