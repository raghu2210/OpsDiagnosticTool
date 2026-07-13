// Ported 1:1 from app.py's normalize_dashes()/_linkify(). Keep the regex in sync with
// scripts/generate-fallback-json.mjs's duplicated copy (that script runs outside the
// TS build so it can't import this module).

const DASH_RE = /[‐‑‒–—―−﹘﹣－⁃]/g;

/** Replace any Unicode dash/hyphen/minus with a plain "-" in a string value. */
export function normalizeDashes<T>(value: T): T {
  return (typeof value === "string" ? (value.replace(DASH_RE, "-") as unknown as T) : value);
}

/** Deep-normalize every string field of a plain object/array (Masters/Recommendations rows). */
export function normalizeDashesDeep<T>(input: T): T {
  if (Array.isArray(input)) return input.map(normalizeDashesDeep) as unknown as T;
  if (input && typeof input === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      out[k] = normalizeDashesDeep(v);
    }
    return out as T;
  }
  return normalizeDashes(input);
}

const URL_RE = /https?:\/\/\S+/;

/** Return the first bare URL found in `text` (trimming trailing punctuation), or null. */
export function linkify(text: unknown): string | null {
  if (typeof text !== "string") return null;
  const m = text.match(URL_RE);
  return m ? m[0].replace(/[).,]+$/, "") : null;
}
