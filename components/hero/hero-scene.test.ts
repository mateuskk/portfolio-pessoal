import { describe, expect, it } from "vitest";

import { getSculptureRevealPose } from "@/lib/hero-sculpture-motion";

describe("hero sculpture reveal", () => {
  it("moves the sculpture from an offset pose into its settled pose", () => {
    expect(getSculptureRevealPose(0)).toEqual({ x: 0.42, scale: 0.88, spin: 0.24 });
    expect(getSculptureRevealPose(1)).toEqual({ x: 0, scale: 1, spin: 0.075 });
  });
});
