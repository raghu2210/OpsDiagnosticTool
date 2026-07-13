import { AlertTriangle, Download } from "lucide-react";
import { loadMasters, loadRecommendations } from "@/lib/data/masters-source";
import { APP_VERSION, APP_UPDATED, FLOW_STEPS, WORKFLOW_SECTIONS, CHANGELOG } from "@/lib/domain/workflow-content";
import { Reveal } from "@/components/motion/Reveal";

function StatStrip({ items }: { items: { label: string; value: number }[] }) {
  return (
    <div className="flex flex-wrap gap-8 font-code text-sm py-6 px-6 rounded-md border border-rule bg-surface shadow-sm">
      {items.map((item) => (
        <div key={item.label}>
          <div className="text-2xl font-medium text-ink">{item.value}</div>
          <div className="text-neutral text-xs uppercase tracking-wider mt-1">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

function Section({ title, body }: { title: string; body: string[] }) {
  return (
    <details className="group border border-rule rounded-md bg-surface shadow-sm px-5 py-4 mb-3" open>
      <summary className="cursor-pointer list-none flex items-center justify-between">
        <h3 className="font-display text-xl font-medium">{title}</h3>
        <span className="text-neutral group-open:rotate-90 transition-transform">&rsaquo;</span>
      </summary>
      <div className="pt-4 text-sm text-neutral leading-relaxed space-y-3 max-w-2xl">
        {body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </details>
  );
}

export default async function WorkflowPage() {
  const [masters, recommendations] = await Promise.all([loadMasters(), loadRecommendations()]);
  const active = masters.filter((r) => r.status === "active");

  const nModules = new Set(active.map((r) => r.module_id)).size;
  const nAreas = new Set(active.map((r) => `${r.module_id}::${r.area_id}`)).size;
  const nPoints = active.length;
  const nRecos = recommendations.length;

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Workflow</h1>
        <a
          href="/api/workflow/pdf"
          className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xs bg-charcoal text-white hover:bg-ink transition-colors"
        >
          <Download className="w-4 h-4" />
          Download workflow (PDF)
        </a>
      </div>
      <p className="text-neutral mb-8 max-w-xl">
        v{APP_VERSION} &middot; updated {APP_UPDATED} &middot; living documentation of the platform.
      </p>

      <div className="flex items-start gap-3 rounded-sm border border-amber/30 bg-amber/5 px-4 py-3 mb-8">
        <AlertTriangle className="w-4 h-4 text-amber shrink-0 mt-0.5" />
        <p className="text-sm text-ink">
          <strong className="font-semibold">Living document &mdash; keep in lock-step with the app.</strong> Every
          time the workflow changes (a step, data schema, scoring math, an output, navigation, or storage), this tab
          must be updated: bump the version, set the date, add a changelog entry, and revise the sections below.
        </p>
      </div>

      <Reveal>
        <StatStrip
          items={[
            { label: "Modules", value: nModules },
            { label: "Areas", value: nAreas },
            { label: "Sub-points", value: nPoints },
            { label: "Recommendation rows", value: nRecos },
          ]}
        />
      </Reveal>

      <Reveal delay={0.05}>
        <div className="py-8">
          <h2 className="font-display text-2xl font-semibold mb-4">End-to-end flow</h2>
          <div className="flex flex-wrap items-center gap-2 font-code text-sm mb-3">
            {FLOW_STEPS.map((step, i) => (
              <span key={step} className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-rule bg-surface shadow-sm">
                  <span className="text-accent">{i + 1}</span> {step}
                </span>
                {i < FLOW_STEPS.length - 1 && <span className="text-neutral">&rsaquo;</span>}
              </span>
            ))}
          </div>
          <p className="text-sm text-neutral max-w-xl">
            Two operating flows share one data layer: <strong className="text-ink font-medium">Build</strong>{" "}
            (generate a blank checklist) and <strong className="text-ink font-medium">Diagnose</strong> (score a
            checklist and get prescriptive actions). The <strong className="text-ink font-medium">Sync Tracker</strong>{" "}
            page is a separate, read-only mirror of a hand-maintained Google Sheet.
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div>
          {WORKFLOW_SECTIONS.map((s) => (
            <Section key={s.title} title={s.title.replace("-", "·")} body={s.body} />
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.15}>
        <div className="pt-8">
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <h2 className="font-display text-2xl font-semibold">Changelog</h2>
            <a
              href="/api/changelog/pdf"
              className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xs border border-rule hover:border-accent transition-colors"
            >
              <Download className="w-4 h-4" />
              Download changelog (PDF)
            </a>
          </div>
          <div className="space-y-3">
            {CHANGELOG.map((entry) => (
              <div key={entry.version} className="flex gap-4 border border-rule rounded-md bg-surface shadow-sm px-5 py-4">
                <div className="font-code text-xs text-neutral pt-1 w-20 shrink-0">
                  v{entry.version}
                  <div className="mt-0.5">{entry.date}</div>
                </div>
                <p className="text-sm text-neutral leading-relaxed">{entry.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
