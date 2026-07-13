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
  muted: { color: PDF_COLOR.neutral, fontSize: 9, marginBottom: 16 },
  row: { flexDirection: "row", gap: 12, marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${PDF_COLOR.rule}` },
  ver: { fontSize: 8.5, color: PDF_COLOR.neutral, width: 70 },
  entryBody: { fontSize: 9, lineHeight: 1.45, flex: 1 },
  footer: {
    marginTop: 20,
    paddingTop: 10,
    borderTop: `1px solid ${PDF_COLOR.rule}`,
    fontSize: 8,
    color: PDF_COLOR.neutral,
    fontStyle: "italic",
  },
});

export interface ChangelogReportProps {
  version: string;
  updated: string;
  changelog: readonly { version: string; date: string; body: string }[];
}

/** The version history on its own, separate from WorkflowReport - mirrors app.py's
 * build_changelog_pdf(). */
export function ChangelogReport({ version, updated, changelog }: ChangelogReportProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src={PDF_LOGO_PATH} style={styles.logo} />
          <Text style={styles.headerTitle}>{pdfSafe("Workflow Changelog")}</Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{pdfSafe("LongArc Diagnostic Tool - Workflow Changelog")}</Text>
          <Text style={styles.muted}>{pdfSafe(`Current version ${version} - updated ${updated}`)}</Text>

          {changelog.map((entry) => (
            <View key={entry.version} style={styles.row} wrap={false}>
              <Text style={styles.ver}>{pdfSafe(`v${entry.version}\n${entry.date}`)}</Text>
              <Text style={styles.entryBody}>{pdfSafe(entry.body)}</Text>
            </View>
          ))}

          <Text style={styles.footer}>
            {pdfSafe("Built & powered by LongArc - Operations Strategy for Growing Businesses - golongarc.com")}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
