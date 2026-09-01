import type { Metadata } from "next";

import type { PortfolioContent } from "@/content/portfolio";

type MetadataPerson = Pick<PortfolioContent["person"], "name" | "role">;

export function createPortfolioMetadata(person: MetadataPerson): Metadata {
  const title = `${person.name} · ${person.role}`;
  const description = "Portfolio of a creative developer crafting precise digital experiences through technology, typography, and motion.";
  const socialDescription = "A selection of precise digital experiences shaped through technology, typography, and motion.";

  return {
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description: socialDescription,
      images: [{ url: "/og.png", alt: `${title} portfolio` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: socialDescription,
      images: ["/og.png"],
    },
  };
}
