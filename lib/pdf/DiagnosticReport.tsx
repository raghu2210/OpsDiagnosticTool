import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { DiagnosticResult } from "@/lib/domain/types";
import { scoreBand } from "@/lib/domain/bands";
import { PDF_COLOR, PDF_LOGO_PATH } from "./pdf-theme";

const styles = StyleSheet.create({
  page: { fontSize: 10, color: PDF_COLOR.ink, paddingBottom: 40 },
  header: {
    backgroundColor: PDF_COLOR.charcoal,
    height: 60,
    paddingHorizontal: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: { height: 26 },
  headerTitle: { color: "#ffffff", fontSize: 13, fontWeight: 700 },
  body: { paddingHorizontal: 32, paddingTop: 24 },
  moduleName: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  muted: { color: PDF_COLOR.neutral, fontSize: 9 },
  scoreRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 10 },
  scoreNum: { fontSize: 34, fontWeight: 700 },
  bandLabel: { fontSize: 12, fontWeight: 700, marginTop: 4 },
  sectionTitle: { fontSize: 13, fontWeight: 700, marginTop: 20, marginBottom: 10 },
  areaRow: { marginBottom: 10 },
  areaLabelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  barTrack: { height: 5, backgroundColor: "#e6e6e6", borderRadius: 2 },
  barFill: { height: 5, borderRadius: 2 },
  priorityItem: { marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${PDF_COLOR.rule}` },
  priorityTitle: { fontSize: 10.5, fontWeight: 700, marginBottom: 2 },
  task: { fontSize: 9.5, marginTop: 2, marginLeft: 8 },
  priorityPhoto: { width: 100, height: 75, objectFit: "cover", borderRadius: 2, marginTop: 4, marginBottom: 4 },
  footer: {
    // Flows naturally at the end of the content instead of a fixed `position: absolute`
    // offset - found via direct PDF inspection that a fixed-bottom footer overlaps the
    // last priority item's text once content is long enough to reach that offset.
    marginTop: 20,
    paddingTop: 10,
    borderTop: `1px solid ${PDF_COLOR.rule}`,
    fontSize: 8,
    color: PDF_COLOR.neutral,
    fontStyle: "italic",
  },
});

/**
 * @react-pdf/renderer's default core font (Helvetica) has no glyphs for Unicode
 * punctuation like em-dash/en-dash/middot/arrows - those silently render as the wrong
 * glyph (found via direct PDF inspection: an arrow rendered as a stray apostrophe).
 * This mirrors app.py's _pdf_safe()/_PDF_SUBS: map everything to plain ASCII rather than
 * embedding a custom Unicode font, which is unnecessary for this report's content.
 *
 * Also: every dynamic line below is built as ONE template-literal string passed as a
 * single JSX expression child, not JSX text mixed with `{expr}` interpolations - react-pdf's
 * text layout collapses whitespace between adjacent text/expression nodes (found via the
 * same inspection: "target {n}" rendered as "target2" with no space). A single string
 * expression sidesteps that entirely.
 */
/** Shows whole numbers plainly (directly-scored items) and one decimal only for
 * fractional weighted rollups (Node-4 problem-statement items). */
function fmtScore(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function pdfSafe(text: string): string {
  return text
    .replace(/[–—‒―‐‑]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[•·]/g, "-")
    .replace(/→/g, "->")
    .replace(/←/g, "<-")
    .replace(/[^\x00-\x7F]/g, "");
}

/** Same merge as ResultsReveal.tsx's priority list - a directly-scored sub-point (Node 3)
 * or a scored problem statement (Node 4), whichever level applies. Sub-points broken down
 * to Node 4 are represented by their problems instead of themselves. */
interface PriorityItem {
  key: string;
  code: string;
  areaName: string;
  label: string;
  score: number;
  target: number;
  targetName: string;
  weightedGap: number;
  observation: string;
  photo?: string;
  tasks: string;
}

function buildPriority(diag: DiagnosticResult): PriorityItem[] {
  const problemSubpointIds = new Set(diag.scored_problems.map((p) => p.subpoint_id));
  return [
    ...diag.scored
      .filter((s) => s.score < 5 && !problemSubpointIds.has(s.subpoint_id))
      .map((s): PriorityItem => ({
        key: s.subpoint_id,
        code: s.subpoint_id,
        areaName: s.area_name,
        label: s.subpoint_name,
        score: s.score,
        target: s.target,
        targetName: s.target_name,
        weightedGap: s.weighted_gap,
        observation: s.observation,
        photo: s.photo,
        tasks: s.tasks,
      })),
    ...diag.scored_problems
      .filter((p) => p.score < 5)
      .map((p): PriorityItem => ({
        key: p.problem_id,
        code: p.problem_id,
        areaName: p.area_name,
        label: `${p.subpoint_name} / ${p.problem_name}`,
        score: p.score,
        target: p.target,
        targetName: p.target_name,
        weightedGap: p.weighted_gap,
        observation: p.observation,
        photo: p.photo,
        tasks: p.tasks,
      })),
  ].sort((a, b) => b.weightedGap - a.weightedGap);
}

export function DiagnosticReport({ moduleName, diag }: { moduleName: string; diag: DiagnosticResult }) {
  const band = scoreBand(diag.module_score);
  const priority = buildPriority(diag);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src={PDF_LOGO_PATH} style={styles.logo} />
          <Text style={styles.headerTitle}>{pdfSafe("Operations Diagnostic Report")}</Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.moduleName}>{pdfSafe(moduleName)}</Text>
          <Text style={styles.muted}>
            {pdfSafe(
              `${diag.n_scored} ${diag.n_scored === 1 ? "sub point analysed" : "sub points analysed"}`
            )}
          </Text>

          <View style={styles.scoreRow}>
            <Text style={[styles.scoreNum, { color: band.color }]}>{`${diag.module_score.toFixed(1)} / 5`}</Text>
          </View>
          <Text style={[styles.bandLabel, { color: band.color }]}>
            {pdfSafe(`${band.label} - ${diag.pct.toFixed(0)}% of potential`)}
          </Text>

          <Text style={styles.sectionTitle}>Area maturity</Text>
          {diag.area_scores.map((a) => {
            const b = scoreBand(a.area_score);
            return (
              <View key={a.area_id} style={styles.areaRow}>
                <View style={styles.areaLabelRow}>
                  <Text>{pdfSafe(`${a.area_id}  ${a.area_name}`)}</Text>
                  <Text style={{ color: b.color, fontWeight: 700 }}>
                    {pdfSafe(`${a.area_score.toFixed(1)} ${b.label}`)}
                  </Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${(a.area_score / 5) * 100}%`, backgroundColor: b.color }]} />
                </View>
              </View>
            );
          })}

          <Text style={styles.sectionTitle}>{pdfSafe("Priority actions - tasks to reach the next level")}</Text>
          {priority.length === 0 ? (
            <Text style={styles.muted}>No gaps found - every scored sub-point is already best-in-class.</Text>
          ) : (
            priority.map((s, i) => (
              <View key={s.key} style={styles.priorityItem}>
                <Text style={styles.priorityTitle}>
                  {pdfSafe(
                    `${i + 1}. ${s.areaName} / ${s.label} (scored ${fmtScore(s.score)} -> target ${fmtScore(s.target)} ${s.targetName})`
                  )}
                </Text>
                {s.observation ? (
                  <Text style={[styles.muted, { fontStyle: "italic", marginBottom: 2 }]}>
                    {pdfSafe(`Observation: ${s.observation}`)}
                  </Text>
                ) : null}
                {s.photo ? <Image src={s.photo} style={styles.priorityPhoto} /> : null}
                {s.tasks
                  .split("\n")
                  .filter(Boolean)
                  .map((t, ti) => (
                    <Text key={ti} style={styles.task}>
                      {pdfSafe(`-  ${t.trim()}`)}
                    </Text>
                  ))}
              </View>
            ))
          )}

          <Text style={styles.footer}>
            {pdfSafe("Built & powered by LongArc - FnV Warehouse Diagnostics for Quick Commerce - golongarc.com")}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
