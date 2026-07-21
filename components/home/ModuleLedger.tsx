import Link from "next/link";
import type { ModuleSummary } from "@/lib/domain/types";

/**
 * No own card chrome - nested inside the single shared panel in app/page.tsx's "Or jump
 * straight in" section alongside MaturityLadder. Content is vertically centered
 * (`h-full flex flex-col justify-center`) so a single module (the current, realistic
 * case - this product has consolidated to one active module) fills the panel's full
 * height intentionally instead of leaving it looking like a half-empty list with one row.
 */
export function ModuleLedger({ modules }: { modules: ModuleSummary[] }) {
  return (
    <div className="h-full flex flex-col justify-center gap-8">
      {modules.map((m) => (
        <div key={m.module_id}>
          <div className="font-code text-xs text-neutral mb-2">{m.module_id}</div>
          <div className="font-display text-2xl font-medium mb-2">{m.module_name}</div>
          <div className="text-sm text-neutral mb-6 max-w-sm">
            {m.areas} areas &middot; {m.sub_points} sub-points, scored against a clear 1&ndash;5 maturity scale.
          </div>
          <Link
            href={`/diagnose?module=${m.module_id}`}
            className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xs bg-charcoal text-white hover:bg-ink transition-colors"
          >
            Start diagnosing
          </Link>
        </div>
      ))}
    </div>
  );
}
