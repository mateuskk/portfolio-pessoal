import { describe, expect, it } from "vitest";

import { shouldUseSmoothScroll } from "./smooth-scroll-provider";

describe("shouldUseSmoothScroll", () => {
  it("enables inertia only when reduced motion is not requested", () => {
    expect(shouldUseSmoothScroll({ matches: true })).toBe(true);
    expect(shouldUseSmoothScroll({ matches: false })).toBe(false);
  });
});
