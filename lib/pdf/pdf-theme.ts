import path from "node:path";
import { COLOR } from "@/styles/tokens";

/** Shared constants for the branded PDF header, reused by DiagnosticReport (Phase A) and
 * the Workflow/Changelog PDFs (Phase B) so every export looks like the same document family. */
export const PDF_LOGO_PATH = path.join(process.cwd(), "public", "longarc-logo.png");
export const PDF_HEADER_HEIGHT = 60;
export { COLOR as PDF_COLOR };
