import { describe, expect, it } from "vitest";

import { createPortfolioMetadata } from "./metadata";

describe("createPortfolioMetadata", () => {
  it("derives public identity metadata from the centralized person content", () => {
    const metadata = createPortfolioMetadata({ name: "Ada Example", role: "Interface Engineer" });

    expect(metadata.title).toBe("Ada Example · Interface Engineer");
    expect(metadata.openGraph?.title).toBe("Ada Example · Interface Engineer");
    expect(metadata.twitter?.title).toBe("Ada Example · Interface Engineer");
    expect(metadata.openGraph?.images).toEqual([
      { url: "/og.png", alt: "Ada Example · Interface Engineer portfolio" },
    ]);
  });
});
