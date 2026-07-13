"use client";

import { motion } from "framer-motion";
import { LEVEL_NAME } from "@/lib/domain/types";
import { scoreBand } from "@/lib/domain/bands";

const LEVEL_DESCRIPTIONS: Record<number, string> = {
  1: "Reactive and ad-hoc, no clear ownership or record.",
  2: "Something exists but is inconsistent and manual.",
  3: "A defined process exists, documented and followed.",
  4: "Actively managed against KPIs with system support.",
  5: "Fully digitized, automated, continuously improved.",
};

const HEIGHTS = [64, 96, 128, 160, 192]; // ascending steps, level 1 -> 5

/**
 * The Maturity Ladder as an actual graphic - ascending, color-coded steps (a literal
 * staircase) instead of a text list. Every score in the app maps to one of these five
 * steps, so this is the visual grammar reused wherever a maturity level appears.
 */
export function MaturityLadder() {
  return (
    <div className="border border-rule rounded-md p-6 bg-surface shadow-sm">
      <div className="font-code text-xs uppercase tracking-wider text-neutral mb-6">The Maturity Ladder</div>

      <div className="flex items-end gap-2 h-48 mb-4">
        {[1, 2, 3, 4, 5].map((level, i) => {
          const { color } = scoreBand(level);
          return (
            <motion.div
              key={level}
              className="flex-1 rounded-t-xs flex items-start justify-center pt-2"
              style={{ backgroundColor: color }}
              initial={{ height: 0 }}
              whileInView={{ height: HEIGHTS[i] }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.23, 1, 0.32, 1] }}
            >
              <span className="font-code text-xs font-medium text-white">{level}</span>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-5 gap-2 text-center mb-5">
        {[1, 2, 3, 4, 5].map((level) => (
          <div key={level} className="font-display text-[11px] font-medium leading-tight">
            {LEVEL_NAME[level as 1 | 2 | 3 | 4 | 5]}
          </div>
        ))}
      </div>

      <div className="space-y-2.5 pt-4 border-t border-rule">
        {[5, 4, 3, 2, 1].map((level) => {
          const { color } = scoreBand(level);
          return (
            <div key={level} className="flex items-start gap-2.5 text-sm">
              <span
                className="font-code text-xs font-medium w-4 h-4 rounded-full flex items-center justify-center text-white shrink-0 mt-0.5"
                style={{ backgroundColor: color }}
              >
                {level}
              </span>
              <span className="text-neutral">{LEVEL_DESCRIPTIONS[level]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
