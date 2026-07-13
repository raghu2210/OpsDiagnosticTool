import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import { TopNav } from "@/components/nav/TopNav";
import { Footer } from "@/components/nav/Footer";
import "./globals.css";

// Display and body both moved to Helvetica Neue (a plain CSS system-font stack set
// directly in globals.css's --font-display/--font-body) - not loadable via next/font/google
// since it's an Apple/Linotype-licensed system font, not an open webfont. Fraunces/Inter
// are no longer loaded here.

// Used sparingly for structural codes (module/area/subpoint IDs like WH_V1, A1.1, 2.1)
// to reinforce the audit-taxonomy feel without resorting to badges/pills everywhere.
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "LongArc Diagnostic Tool",
  description: "Operations Strategy for Growing Businesses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plexMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <TopNav />
        <main className="flex-1 mx-auto w-full max-w-6xl px-6 md:px-10 py-10">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
