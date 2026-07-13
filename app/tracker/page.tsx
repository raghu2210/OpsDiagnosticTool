import { loadTracker } from "@/lib/data/tracker-source";
import { TrackerTable } from "@/components/tracker/TrackerTable";

export const revalidate = 60;

export default async function TrackerPage() {
  const rows = await loadTracker();

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-tight mb-2">Sync Tracker</h1>
      <p className="text-neutral mb-8 max-w-xl">
        A running log the team updates by hand in Google Sheets. Re-reads on a 60s cache, so edits show up here
        without redeploying.
      </p>
      <TrackerTable initialRows={rows} />
    </div>
  );
}
