import Link from "next/link";
import type { ModuleSummary } from "@/lib/domain/types";

export function ModuleLedger({ modules }: { modules: ModuleSummary[] }) {
  return (
    <div className="border border-rule rounded-md divide-y divide-rule bg-surface shadow-sm">
      {modules.map((m) => (
        <div key={m.module_id} className="flex items-center justify-between gap-4 px-5 py-4">
          <div>
            <div className="font-code text-xs text-neutral">{m.module_id}</div>
            <div className="font-display text-lg font-medium">{m.module_name}</div>
            <div className="text-sm text-neutral mt-0.5">
              {m.areas} areas &middot; {m.sub_points} sub-points
            </div>
          </div>
          <Link
            href={`/diagnose?module=${m.module_id}`}
            className="text-sm font-medium px-3 py-1.5 rounded-xs bg-charcoal text-white hover:bg-ink transition-colors shrink-0"
          >
            Diagnose
          </Link>
        </div>
      ))}
    </div>
  );
}
