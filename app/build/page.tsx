import { loadMasters } from "@/lib/data/masters-source";
import { BuildFlow } from "@/components/build/BuildFlow";

export default async function BuildPage() {
  const masters = await loadMasters();
  const active = masters.filter((r) => r.status === "active");

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-tight mb-2">Build a Checklist</h1>
      <p className="text-neutral mb-8 max-w-xl">
        Pick a module, choose one or more areas, and export a fillable audit workbook benchmarked on a clear 1-5
        maturity scale.
      </p>
      <BuildFlow masters={active} />
    </div>
  );
}
