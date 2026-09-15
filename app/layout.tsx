import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter, Inter_Tight } from "next/font/google";

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
      <body className={`${inter.variable} ${interTight.variable} ${instrumentSerif.variable}`}>
        {children}
      </body>
    </html>
  );
}
