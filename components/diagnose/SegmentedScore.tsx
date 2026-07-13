"use client";

import { scoreBand } from "@/lib/domain/bands";

/**
 * Replaces a native <select> for entering a 1-5 score - a tactile, band-colored segmented
 * control instead of generic browser dropdown chrome. Clicking the already-selected value
 * clears it back to un-scored (there's no separate "clear" affordance to keep it compact).
 */
export function SegmentedScore({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="inline-flex rounded-xs border border-rule overflow-hidden" role="radiogroup">
      {[1, 2, 3, 4, 5].map((n) => {
        const selected = value === String(n);
        const { color } = scoreBand(n);
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(selected ? "" : String(n))}
            className="font-code text-sm w-8 h-8 flex items-center justify-center border-r border-rule last:border-r-0 transition-colors"
            style={
              selected
                ? { backgroundColor: color, color: "#fff" }
                : { backgroundColor: "transparent", color: "var(--neutral)" }
            }
            onMouseEnter={(e) => {
              if (!selected) e.currentTarget.style.backgroundColor = "rgba(58,58,58,0.06)";
            }}
            onMouseLeave={(e) => {
              if (!selected) e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
