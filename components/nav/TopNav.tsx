"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/diagnose", label: "Diagnose" },
  { href: "/tracker", label: "Tracker" },
  { href: "/workflow", label: "Workflow" },
] as const;

/**
 * Floating glassmorphic pill nav - sticky, blurred, rounded, with a subtle inset
 * highlight for depth - instead of a plain full-width bar with a bottom rule. Applied
 * globally (not just on Home) so the "premium/tech-heavy" chrome is consistent everywhere,
 * rather than needing two nav variants (a pattern that caused real bugs in an earlier,
 * CSS-only version of this app).
 */
export function TopNav() {
  const pathname = usePathname();
  return (
    <div className="sticky top-4 z-50 px-4 md:px-6 pt-4">
      <nav
        className="mx-auto max-w-3xl rounded-2xl border border-black/[0.08] bg-white/70 backdrop-blur-xl px-2.5 py-2 flex items-center justify-between gap-2"
        style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04), inset 0 1px 1px rgba(255,255,255,0.6)" }}
      >
        <Link href="/" className="flex items-center pl-1.5 pr-2 shrink-0">
          {/* The PNG is a full wordmark (charcoal badge with "LongArc" baked in as
              white type), not an icon mark - render at its native ~2.81:1 aspect
              ratio instead of squashing into a square, and don't pair it with a
              redundant text label that duplicates what's already in the image. */}
          <Image src="/longarc-logo.png" alt="LongArc" width={73} height={26} className="rounded-xs" />
        </Link>
        <ul className="flex items-center gap-0.5">
          {NAV.map(({ href, label }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`inline-block px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                    active ? "bg-charcoal text-white" : "text-neutral hover:text-accent hover:bg-black/[0.04]"
                  }`}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
