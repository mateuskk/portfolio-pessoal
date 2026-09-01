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
  openGraph: {
    type: "website",
    title: "Seu Nome — Creative Developer",
    description: "A selection of precise digital experiences shaped through technology, typography, and motion.",
    images: [{ url: "/og.png", alt: "Seu Nome — Creative Developer portfolio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Seu Nome — Creative Developer",
    description: "A selection of precise digital experiences shaped through technology, typography, and motion.",
    images: ["/og.png"],
  },
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
