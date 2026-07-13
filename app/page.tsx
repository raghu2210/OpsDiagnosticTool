import { loadMasters } from "@/lib/data/masters-source";
import type { ModuleSummary } from "@/lib/domain/types";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { ModuleLedger } from "@/components/home/ModuleLedger";
import { MaturityLadder } from "@/components/home/MaturityLadder";

function summarizeModules(masters: Awaited<ReturnType<typeof loadMasters>>): ModuleSummary[] {
  const byModule = new Map<string, { name: string; areas: Set<string>; subpoints: number }>();
  for (const row of masters) {
    const entry = byModule.get(row.module_id) ?? { name: row.module_name, areas: new Set(), subpoints: 0 };
    entry.areas.add(row.area_id);
    entry.subpoints += 1;
    byModule.set(row.module_id, entry);
  }
  return [...byModule.entries()]
    .map(([module_id, v]) => ({
      module_id,
      module_name: v.name,
      areas: v.areas.size,
      sub_points: v.subpoints,
    }))
    .sort((a, b) => a.module_id.localeCompare(b.module_id));
}

export default async function HomePage() {
  const masters = await loadMasters();
  const active = masters.filter((r) => r.status === "active");
  const modules = summarizeModules(active);
  const totalAreas = new Set(active.map((r) => `${r.module_id}::${r.area_id}`)).size;
  const totalSubpoints = active.length;

  return (
    <div>
      <Hero />
      <HowItWorks />

      <div className="pt-4 pb-10 border-t border-rule">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-display text-2xl font-semibold">Or jump straight in</h2>
          <div className="flex gap-6 font-code text-sm text-neutral">
            <span>
              <span className="font-medium text-ink">{modules.length}</span> modules
            </span>
            <span>
              <span className="font-medium text-ink">{totalAreas}</span> areas
            </span>
            <span>
              <span className="font-medium text-ink">{totalSubpoints}</span> sub-points
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8 items-start">
          <ModuleLedger modules={modules} />
          <MaturityLadder />
        </div>
      </div>
    </div>
  );
}
