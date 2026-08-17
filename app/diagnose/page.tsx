import { loadMasters, loadProblems, loadRecommendations, loadWeightProfiles } from "@/lib/data/masters-source";
import { DiagnoseFlow } from "@/components/diagnose/DiagnoseFlow";

export default async function DiagnosePage({
  searchParams,
}: {
  searchParams: Promise<{ module?: string }>;
}) {
  const { module: initialModuleId } = await searchParams;
  const [masters, recommendations, problems, weightProfiles] = await Promise.all([
    loadMasters(),
    loadRecommendations(),
    loadProblems(),
    loadWeightProfiles(),
  ]);
  const active = masters.filter((r) => r.status === "active");

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-tight mb-2">Score &amp; Diagnose</h1>
      <p className="text-neutral mb-8 max-w-xl">
        Score the sub-points in-app and get a weighted maturity diagnostic with the tasks needed to reach the next
        level.
      </p>
      <DiagnoseFlow
        masters={active}
        recommendations={recommendations}
        problems={problems}
        weightProfiles={weightProfiles}
        initialModuleId={initialModuleId}
      />
    </div>
  );
}
