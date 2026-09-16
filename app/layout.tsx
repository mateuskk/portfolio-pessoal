import type { Metadata, Viewport } from "next";
import {
  EB_Garamond,
  Fraunces,
  Instrument_Serif,
  Inter,
  Inter_Tight,
} from "next/font/google";

import { portfolioContent } from "@/content/portfolio";
import { createPortfolioMetadata } from "@/lib/metadata";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

/**
 * Loaded in italic alone, because that is the only cut this site sets.
 *
 * It carries one word: the second line of the hero. Asking for the roman as
 * well would double what the reader downloads for letterforms the page never
 * draws.
 */
const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-eb-garamond",
  style: "italic",
  display: "swap",
});

/**
 * Italic only, same reasoning: it is never set upright anywhere on this site.
 *
 * Two places reach for it, the emphasis inside the about statement and the
 * question that opens the contact section. Unlike the other serifs here this
 * one is variable across weight, which matters for the first of those: that
 * emphasis inherits `font-light` from the heading around it and so actually
 * renders at 300.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  style: "italic",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = createPortfolioMetadata(portfolioContent.person);

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#090909",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${interTight.variable} ${instrumentSerif.variable} ${ebGaramond.variable} ${fraunces.variable}`}>
        {children}
      </body>
    </html>
  );
}
