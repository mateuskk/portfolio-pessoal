export type SculptureRevealPose = {
  x: number;
  scale: number;
  spin: number;
};

export type SculpturePointerPose = {
  x: number;
  y: number;
  rotationX: number;
  rotationY: number;
};

type PointerBounds = {
  height: number;
  left: number;
  top: number;
  width: number;
};

export function getNormalizedVisualPointer(
  clientX: number,
  clientY: number,
  bounds: PointerBounds,
) {
  if (bounds.width <= 0 || bounds.height <= 0) return null;

  const right = bounds.left + bounds.width;
  const bottom = bounds.top + bounds.height;
  if (
    clientX < bounds.left ||
    clientX > right ||
    clientY < bounds.top ||
    clientY > bottom
  ) {
    return null;
  }

  return {
    x: ((clientX - bounds.left) / bounds.width - 0.5) * 2,
    y: (0.5 - (clientY - bounds.top) / bounds.height) * 2,
  };
}

export function getSculpturePointerPose(
  pointerX: number,
  pointerY: number,
  enabled = true,
): SculpturePointerPose {
  if (!enabled) {
    return { x: 0, y: 0, rotationX: 0, rotationY: 0 };
  }

  const x = Math.min(Math.max(pointerX, -1), 1);
  const y = Math.min(Math.max(pointerY, -1), 1);

  return {
    x: x * 0.12,
    y: y * 0.08,
    rotationX: -y * 0.16,
    rotationY: x * 0.16,
  };
}

export function getSculptureRevealPose(progress: number): SculptureRevealPose {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const easedProgress = 1 - (1 - clampedProgress) ** 3;
  const remaining = 1 - easedProgress;

  return {
    x: 0.42 * remaining,
    scale: 0.88 + 0.12 * easedProgress,
    spin: 0.075 + 0.165 * remaining,
  };
}
