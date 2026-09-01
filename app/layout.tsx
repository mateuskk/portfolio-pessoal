import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Seu Nome — Creative Developer",
  description: "Portfolio of a creative developer crafting precise digital experiences through technology, typography, and motion.",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#090909",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${instrumentSerif.variable}`}>{children}</body>
    </html>
  );
}
