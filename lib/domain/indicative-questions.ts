/**
 * Turns a sub-point's MasterRow.indicative_scoring_questions text (one bullet per line, e.g.
 * "• Is there a defined slot-booking mechanism...?\n• What % arrive within their booked
 * slot?") into a list of required per-question answer fields in ScoreForm, and recombines the
 * reviewer's answers into the single "observation" string the rest of the app already
 * consumes (auto-score, computeDiagnostic, results, PDF export).
 */

const BULLET_PREFIX = /^[•\-*]\s*/;
const NA_PATTERN = /^(n\.?\/?a\.?|not\s*applicable)$/i;

export function parseIndicativeQuestions(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((line) => line.replace(BULLET_PREFIX, "").trim())
    .filter(Boolean);
}

/** True for "NA", "N/A", "n.a.", "Not Applicable" (any casing/whitespace) - these answers are
 * dropped from the composed observation rather than fed to the scorer. */
export function isNotApplicable(answer: string): boolean {
  return NA_PATTERN.test(answer.trim());
}

/** True once every question has *some* answer (a real one, or "NA") - the gate for auto-firing
 * scoring, so a row is never scored off a partially-answered set of questions. */
export function allQuestionsAnswered(questions: string[], answers: string[]): boolean {
  return questions.every((_, i) => (answers[i] ?? "").trim().length > 0);
}

/** Builds the text sent to auto-score / stored as the row's observation: one "Q: ...\nA: ..."
 * block per answered (non-NA) question, plus the optional free-text observation appended last.
 * Returns "" if nothing qualifies, mirroring the pre-existing "empty observation -> skip
 * auto-score" behavior in ScoreForm's handleObsBlur. */
export function composeObservation(questions: string[], answers: string[], extra: string): string {
  const blocks: string[] = [];
  questions.forEach((question, i) => {
    const answer = (answers[i] ?? "").trim();
    if (!answer || isNotApplicable(answer)) return;
    blocks.push(`Q: ${question}\nA: ${answer}`);
  });
  const extraTrimmed = extra.trim();
  if (extraTrimmed) blocks.push(extraTrimmed);
  return blocks.join("\n\n");
}
