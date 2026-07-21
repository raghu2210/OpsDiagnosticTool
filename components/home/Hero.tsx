"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";

// Repositioned as an FnV warehouse diagnostic for quick commerce (not a general multi-domain
// ops tool) - the marquee lists the actual sub-domains this diagnostic covers, not a marquee
// of borrowed brand logos, since there's no such thing as an internal-audit-tool's
// investor/partner marquee. Genuinely descriptive content standing in for decoration.
const DOMAINS = [
  "Inward & Quality Grading",
  "Cold Chain & Storage",
  "Warehouse Flow & Layout",
  "Vendor & Collection Center Ops",
  "Spoilage & Wastage",
  "Rejection & Returns Handling",
  "Pick-Pack Accuracy",
  "Metrics & Visibility",
  "People & Training",
  "Cost Diagnostics",
];

// Leads with the product action itself ("Score your FnV warehouse") rather than the
// abstract delivery-vs-shelf-life tension - the tension now lives in the subhead instead,
// since the diagnostic covers more than warehouse-floor activity after the 18-area rollout
// (vendor ops, training, people, cost) and the headline needed to read as the umbrella
// action, not just one operational metaphor.
const HEADLINE = "Score your FnV warehouse. Find exactly where it's breaking.";

function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  // autoPlay/muted covers most browsers, but reduced-motion users should never get
  // moving video even if it's muted - stop it explicitly on mount rather than relying on
  // a CSS-only approach (video playback state isn't controllable from CSS).
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      videoRef.current?.pause();
    }
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover opacity-60"
        src="/hero-bg.mp4"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(100deg, rgba(36,36,36,0.88) 25%, rgba(36,36,36,0.55) 65%, rgba(36,36,36,0.35) 100%)" }}
      />
    </div>
  );
}

function GlowBackdrop() {
  // The second glow carries the brand accent (--accent, a grounded rust/terracotta) rather
  // than --amber - amber stays reserved for scoring/status semantics, so the hero's own
  // chrome shouldn't borrow it.
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute -top-40 -left-32 w-[560px] h-[560px] rounded-full blur-[120px] opacity-[0.35]"
        style={{ background: "radial-gradient(circle, var(--charcoal), transparent 70%)" }}
      />
      <div
        className="absolute -bottom-48 -right-24 w-[480px] h-[480px] rounded-full blur-[120px] opacity-[0.28]"
        style={{ background: "radial-gradient(circle, var(--accent), transparent 70%)" }}
      />
    </div>
  );
}

export function Hero() {
  const words = HEADLINE.split(" ");
  return (
    <section
      className="relative rounded-lg overflow-hidden bg-ink text-white min-h-[560px] md:min-h-[640px] flex flex-col justify-between px-8 md:px-14 py-12 md:py-16"
      aria-label="LongArc Operations Diagnostics"
    >
      <BackgroundVideo />
      <GlowBackdrop />

      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-code text-xs uppercase tracking-[0.25em] text-white/60 mb-6"
        >
          LongArc Labs &middot; FnV Warehouse Diagnostics for Quick Commerce
        </motion.div>

        <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05] max-w-3xl mb-6">
          {words.map((w, i) => (
            <motion.span
              key={i}
              className="inline-block mr-[0.28em]"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 + i * 0.06, ease: [0.23, 1, 0.32, 1] }}
            >
              {w}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="text-white/70 text-lg max-w-lg leading-relaxed"
        >
          Fast delivery promises, days-long shelf life &ndash; 18 areas across inward quality, cold chain,
          warehouse flow, vendor operations, people, and cost, scored against a clear 1&ndash;5 maturity scale,
          with a ready-to-use audit checklist for on-ground scoring.
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="text-white/50 text-sm italic mt-3 mb-9"
        >
          We don&rsquo;t just advise &ndash; we get in the trenches and build alongside you.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.1 }}
          className="flex flex-wrap items-center gap-3"
        >
          <Link
            href="/diagnose"
            className="group inline-flex items-center gap-3 bg-white text-ink pl-6 pr-2 py-2 rounded-full font-medium hover:bg-white/90 transition-colors"
          >
            Start a Diagnostic
            <span className="bg-ink text-white rounded-full p-2 group-hover:translate-x-0.5 transition-transform">
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
          <Link
            href="/build"
            className="inline-flex items-center px-6 py-2.5 rounded-full border border-white/25 text-white font-medium hover:bg-white/10 transition-colors"
          >
            Build a Checklist
          </Link>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.3 }}
        className="relative z-10 mt-12"
      >
        <div
          className="w-full max-w-md overflow-hidden"
          style={{ maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)" }}
        >
          <div className="marquee-track">
            {[...DOMAINS, ...DOMAINS].map((d, i) => (
              <span key={i} className="mx-6 shrink-0 text-white/50 text-sm font-code whitespace-nowrap">
                {d}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/50 z-10"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown className="w-5 h-5" />
      </motion.div>
    </section>
  );
}
