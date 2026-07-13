"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

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
 * Scroll-revealed step sequence ending in a CTA into /diagnose - the literal "animation
 * that brings you to Diagnose" the app's flow is supposed to guide toward.
 */
export function HowItWorks() {
  return (
    <section className="py-20">
      <div className="grid md:grid-cols-3 gap-10 md:gap-6 mb-14">
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

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
      >
        <Link
          href="/diagnose"
          className="group inline-flex items-center gap-3 bg-charcoal text-white pl-6 pr-2 py-2 rounded-full font-medium hover:bg-ink transition-colors"
        >
          Start a Diagnostic
          <span className="bg-white text-ink rounded-full p-2 group-hover:translate-x-0.5 transition-transform">
            <ArrowRight className="w-4 h-4" />
          </span>
        </Link>
      </motion.div>
    </section>
  );
}
