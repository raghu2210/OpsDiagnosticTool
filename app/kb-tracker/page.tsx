import { loadKbTracker } from "@/lib/data/masters-source";
import { KbTrackerView } from "@/components/kbtracker/KbTrackerView";

export default async function KbTrackerPage() {
  const rows = await loadKbTracker();

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-tight mb-2">KB Tracker</h1>
      <p className="text-neutral mb-8 max-w-xl">
        Content-authoring status for every sub-point in the knowledge base - closed, needs review, or pending.
        Tap an area to see its sub-point-level breakdown.
      </p>
      <KbTrackerView rows={rows} />
    </div>
  );
}
