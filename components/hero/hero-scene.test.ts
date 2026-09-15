import { describe, expect, it } from "vitest";

import * as sculptureMotion from "@/lib/hero-sculpture-motion";

const { getSculptureRevealPose } = sculptureMotion;

type PointerPose = {
  x: number;
  y: number;
  rotationX: number;
  rotationY: number;
};

type PointerPosition = { x: number; y: number };

const getSculpturePointerPose = (
  sculptureMotion as typeof sculptureMotion & {
    getSculpturePointerPose?: (
      pointerX: number,
      pointerY: number,
      enabled?: boolean,
    ) => PointerPose;
  }
).getSculpturePointerPose;

const getNormalizedVisualPointer = (
  sculptureMotion as typeof sculptureMotion & {
    getNormalizedVisualPointer?: (
      clientX: number,
      clientY: number,
      bounds: { left: number; top: number; width: number; height: number },
    ) => PointerPosition | null;
  }
).getNormalizedVisualPointer;

describe("hero sculpture reveal", () => {
  it("moves the sculpture from an offset pose into its settled pose", () => {
    expect(getSculptureRevealPose(0)).toEqual({ x: 0.42, scale: 0.88, spin: 0.24 });
    expect(getSculptureRevealPose(1)).toEqual({ x: 0, scale: 1, spin: 0.075 });
  });

  it("follows the pointer direction with bounded translation and tilt", () => {
    expect(getSculpturePointerPose?.(1, 1)).toEqual({
      x: 0.12,
      y: 0.08,
      rotationX: -0.16,
      rotationY: 0.16,
    });
    expect(getSculpturePointerPose?.(-2, -3)).toEqual({
      x: -0.12,
      y: -0.08,
      rotationX: 0.16,
      rotationY: -0.16,
    });
  });

  it("returns to a neutral pointer pose when interaction ends", () => {
    expect(getSculpturePointerPose?.(0.8, -0.6, false)).toEqual({
      x: 0,
      y: 0,
      rotationX: 0,
      rotationY: 0,
    });
  });

  it("maps the visual stage rectangle and rejects positions outside it", () => {
    const visual = { left: 620, top: 80, width: 860, height: 740 };

    expect(getNormalizedVisualPointer?.(835, 265, visual)).toEqual({
      x: -0.5,
      y: 0.5,
    });
    expect(getNormalizedVisualPointer?.(1265, 635, visual)).toEqual({
      x: 0.5,
      y: -0.5,
    });
    expect(getNormalizedVisualPointer?.(619, 450, visual)).toBeNull();
    expect(getNormalizedVisualPointer?.(1050, 821, visual)).toBeNull();
  });
});
