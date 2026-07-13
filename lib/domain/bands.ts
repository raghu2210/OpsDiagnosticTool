import { COLOR } from "@/styles/tokens";

export interface ScoreBand {
  label: string;
  color: string;
}

/** Ported 1:1 from app.py's _score_band(). Thresholds and palette must stay in sync. */
export function scoreBand(score: number): ScoreBand {
  if (score >= 4.5) return { label: "Best-in-class", color: COLOR.green };
  if (score >= 3.5) return { label: "Managed", color: COLOR.blue };
  if (score >= 2.5) return { label: "Standardized", color: COLOR.amber };
  if (score >= 1.5) return { label: "Developing", color: COLOR.amberSoft };
  return { label: "At risk", color: COLOR.red };
}

/** Derive the exact score->band boundaries live, so docs/tests can never drift from
 * the implementation (mirrors app.py's _score_band_ranges()). */
export function scoreBandRanges(): Array<{ band: string; from: number; to: number; color: string }> {
  const rows: Array<{ band: string; from: number; to: number; color: string }> = [];
  let prev: string | null = null;
  let lo = 0;
  let prevColor = "";
  for (let x = 0; x <= 5.0001; x = Math.round((x + 0.01) * 100) / 100) {
    const { label, color } = scoreBand(Math.round(x * 100) / 100);
    if (label !== prev) {
      if (prev !== null) {
        rows.push({ band: prev, from: lo, to: Math.round((x - 0.01) * 100) / 100, color: prevColor });
      }
      prev = label;
      lo = Math.round(x * 100) / 100;
      prevColor = color;
    }
  }
  rows.push({ band: prev ?? "", from: lo, to: 5.0, color: prevColor });
  return rows;
}
