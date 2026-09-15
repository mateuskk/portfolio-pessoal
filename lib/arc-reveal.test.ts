import { describe, expect, it } from "vitest";

import {
  ARC_BULGE,
  getArcPath,
  getSectionScrollTarget,
} from "./arc-reveal";

/** Pulls the numbers out of a path so the shape can be reasoned about. */
function numbersIn(path: string) {
  return (path.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
}

describe("getArcPath", () => {
  it("starts off the bottom of the screen and ends off the top", () => {
    // Coordinates are fractions of the box: 1 is the bottom edge, 0 the top.
    // Every y sits past the relevant edge, so nothing of it is ever in frame.
    const start = numbersIn(getArcPath(0)).filter((_, i) => i % 2 === 1);
    expect(Math.min(...start)).toBeGreaterThanOrEqual(1);

    const end = getArcPath(2);
    expect(end).toContain("L 1 0");
    expect(numbersIn(end).filter((_, i) => i % 2 === 1).every((y) => y <= 0)).toBe(true);
  });

  it("covers the whole screen at the turn", () => {
    // At 1 the rising shape has reached the top, so the screen is hidden; this
    // is the moment the page underneath may be moved.
    const covering = getArcPath(1);
    expect(covering.startsWith("M 0 0")).toBe(true);
    expect(covering).toContain("L 0 1.1 Z");
  });

  it("bows the leading edge out and brings it back flat", () => {
    // The control point is what separates a sheet being drawn across from a
    // panel sliding up: it must be furthest from the edge halfway through, and
    // level with it at both ends.
    const offsetAt = (t: number) => {
      const [, edge, , control] = numbersIn(getArcPath(t));
      return Math.abs(edge - control);
    };

    expect(offsetAt(0)).toBeCloseTo(0, 6);
    expect(offsetAt(0.5)).toBeCloseTo(ARC_BULGE, 6);
    expect(offsetAt(1)).toBeCloseTo(0, 6);
    expect(offsetAt(0.25)).toBeLessThan(offsetAt(0.5));
  });

  it("clamps instead of turning itself inside out", () => {
    // A cancelled or overshooting animation can hand this a value past the
    // ends, where the formulae describe a shape with a negative height.
    expect(getArcPath(-0.4)).toBe(getArcPath(0));
    expect(getArcPath(2.6)).toBe(getArcPath(2));
  });

  it("rises monotonically across the whole run", () => {
    let previous = Infinity;
    for (let t = 0; t <= 2.0001; t += 0.05) {
      const edge = numbersIn(getArcPath(t))[1];
      expect(edge).toBeLessThanOrEqual(previous + 1e-9);
      previous = edge;
    }
  });
});

describe("getSectionScrollTarget", () => {
  it("lands the section clear of the navbar", () => {
    // 640 down the page, already scrolled 200, with a 112px scroll margin.
    expect(getSectionScrollTarget(640, 200, 112)).toBe(728);
  });

  it("never asks for a negative scroll", () => {
    expect(getSectionScrollTarget(10, 0, 112)).toBe(0);
  });
});
