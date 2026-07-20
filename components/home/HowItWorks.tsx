"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    n: "01",
    title: "Build a checklist",
    body: "Pick a module and its focus areas - export a fillable audit workbook benchmarked on a clear 1-5 scale.",
  },
  {
    n: "02",
    title: "Score it",
    body: "Fill it in on the ground, or score in-app directly. Either path feeds the same weighted diagnostic.",
  },
  {
    n: "03",
    title: "Get the fix list",
    body: "A weighted maturity score per area and module, plus the exact tasks to reach the next level - ranked by impact.",
  },
] as const;

/**
 * Scroll-revealed step sequence - purely explanatory, no CTA of its own. It hands off
 * directly into the module ledger below ("Or jump straight in"), which already carries
 * the per-module Build checklist / Diagnose actions - repeating a generic "Start a
 * Diagnostic" button here just restated the Hero's CTA without adding a new decision.
 */
export function HowItWorks() {
  return (
    <section className="py-20">
      <div className="grid md:grid-cols-3 gap-10 md:gap-6">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.n}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.12, ease: [0.23, 1, 0.32, 1] }}
          >
            {/* A solid low-opacity "ghost number" rather than an outline-only text
                effect (-webkit-text-stroke isn't supported in Firefox and would render
                the number invisible there - transparent fill with no stroke fallback). */}
            <div className="font-display text-5xl font-semibold text-ink/10 mb-3">{step.n}</div>
            <h3 className="font-display text-xl font-medium mb-2">{step.title}</h3>
            <p className="text-neutral text-sm leading-relaxed max-w-xs">{step.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
