"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Staggered fade-up entrance, used for first-view content only (Home's Maturity Ladder,
 * results reveals) - not applied to anything seen on every interaction, per the
 * "should this animate at all?" frequency test. Respects prefers-reduced-motion via
 * framer-motion's viewport `once` + the global CSS override in globals.css.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay, ease: [0.23, 1, 0.32, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
