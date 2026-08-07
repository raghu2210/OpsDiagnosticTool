import { loadKbTracker, loadMasters } from "@/lib/data/masters-source";
import { KbTrackerView } from "@/components/kbtracker/KbTrackerView";

export default async function KbTrackerPage() {
  const [rows, masters] = await Promise.all([loadKbTracker(), loadMasters()]);
  const activeMasters = masters.filter((r) => r.status === "active");

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-tight mb-2">KB Tracker</h1>
      <p className="text-neutral mb-8 max-w-xl">
        Content-authoring status for every sub-point in the knowledge base - closed, needs review, or pending.
        Tap a sub-point to see its 1-5 maturity descriptions.
      </p>
      <KbTrackerView rows={rows} masters={activeMasters} />
    </div>
  );
}
