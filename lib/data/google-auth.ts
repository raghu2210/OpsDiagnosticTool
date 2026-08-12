import { google } from "googleapis";

const SHEETS_READONLY_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
const SHEETS_READWRITE_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

/**
 * Builds a service-account JWT client from env vars, mirroring app.py's
 * Credentials.from_service_account_info(st.secrets["gcp_service_account"], scopes=...).
 * Returns null (rather than throwing) when credentials aren't configured, so callers can
 * fall back to local/CSV data the same way the Python `try/except` does.
 *
 * Uses `googleapis`'s own re-exported `google.auth.JWT` rather than importing the
 * standalone `google-auth-library` package directly - googleapis bundles its own internal
 * copy of that library, and the two package instances' types are structurally
 * incompatible (private field conflicts) even at matching version ranges.
 *
 * Pass `write: true` for callers that need to persist edits (e.g. KB Tracker level-review
 * approvals) - kept as an opt-in param rather than always requesting the broader scope, so
 * read-only callers stay minimum-privilege.
 */
export function getGoogleAuthClient(opts: { write?: boolean } = {}) {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !rawKey) return null;

  // Vercel/`.env` files store the key with literal "\n" sequences - unescape to real newlines.
  const key = rawKey.replace(/\\n/g, "\n");

  return new google.auth.JWT({
    email,
    key,
    scopes: [opts.write ? SHEETS_READWRITE_SCOPE : SHEETS_READONLY_SCOPE],
  });
}
