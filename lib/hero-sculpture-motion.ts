export type SculptureRevealPose = {
  x: number;
  scale: number;
  spin: number;
};

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
