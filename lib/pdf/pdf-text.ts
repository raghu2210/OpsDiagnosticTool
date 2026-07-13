/** Shared by every branded PDF (DiagnosticReport, WorkflowReport, ChangelogReport) -
 * react-pdf's default core font has no glyphs for Unicode punctuation (em-dash, middot,
 * arrows), so map everything to plain ASCII rather than embedding a custom Unicode font. */
export function pdfSafe(text: string): string {
  return text
    .replace(/[–—‒―‐‑]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[•·]/g, "-")
    .replace(/→/g, "->")
    .replace(/←/g, "<-")
    .replace(/[^\x00-\x7F]/g, "");
}
