import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { PDF_COLOR, PDF_LOGO_PATH } from "./pdf-theme";
import { pdfSafe } from "./pdf-text";

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
  title: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  muted: { color: PDF_COLOR.neutral, fontSize: 9 },
  statRow: { flexDirection: "row", gap: 24, marginTop: 14, marginBottom: 4 },
  statVal: { fontSize: 16, fontWeight: 700 },
  statLab: { fontSize: 8, color: PDF_COLOR.neutral, marginTop: 2 },
  sectionTitle: { fontSize: 13, fontWeight: 700, marginTop: 18, marginBottom: 6 },
  para: { fontSize: 9.5, lineHeight: 1.5, marginBottom: 6, color: PDF_COLOR.ink },
  flowRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4, marginBottom: 4 },
  flowStep: {
    fontSize: 9,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    border: `1px solid ${PDF_COLOR.rule}`,
  },
  footer: {
    marginTop: 20,
    paddingTop: 10,
    borderTop: `1px solid ${PDF_COLOR.rule}`,
    fontSize: 8,
    color: PDF_COLOR.neutral,
    fontStyle: "italic",
  },
});

export interface WorkflowReportProps {
  version: string;
  updated: string;
  stats: { nModules: number; nAreas: number; nPoints: number; nRecos: number };
  flowSteps: string[];
  sections: { title: string; body: string[] }[];
}

/** The workflow doc itself - deliberately does NOT include the changelog (that's
 * ChangelogReport.tsx / app/api/changelog/pdf, a separate download), mirroring app.py's
 * build_workflow_pdf()/build_changelog_pdf() split. */
export function WorkflowReport({ version, updated, stats, flowSteps, sections }: WorkflowReportProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src={PDF_LOGO_PATH} style={styles.logo} />
          <Text style={styles.headerTitle}>{pdfSafe("Platform Workflow")}</Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{pdfSafe("LongArc Diagnostic Tool - Workflow")}</Text>
          <Text style={styles.muted}>{pdfSafe(`Version ${version} - updated ${updated}`)}</Text>

          <View style={styles.statRow}>
            {[
              [stats.nModules, "Modules"],
              [stats.nAreas, "Areas"],
              [stats.nPoints, "Sub-points"],
              [stats.nRecos, "Recommendation rows"],
            ].map(([val, lab]) => (
              <View key={lab as string}>
                <Text style={styles.statVal}>{String(val)}</Text>
                <Text style={styles.statLab}>{pdfSafe(lab as string)}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>End-to-end flow</Text>
          <View style={styles.flowRow}>
            {flowSteps.map((step, i) => (
              <Text key={step} style={styles.flowStep}>
                {pdfSafe(`${i + 1}  ${step}`)}
              </Text>
            ))}
          </View>

          {sections.map((s) => (
            <View key={s.title} wrap={false}>
              <Text style={styles.sectionTitle}>{pdfSafe(s.title)}</Text>
              {s.body.map((p, i) => (
                <Text key={i} style={styles.para}>
                  {pdfSafe(p)}
                </Text>
              ))}
            </View>
          ))}

          <Text style={styles.footer}>
            {pdfSafe("Built & powered by LongArc - FnV Warehouse Diagnostics for Quick Commerce - golongarc.com")}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
