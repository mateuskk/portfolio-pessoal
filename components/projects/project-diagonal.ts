/**
 * The travel amplitudes, taken from the reference rather than chosen.
 *
 * Its panels run from `(70vw, 90vh)` through the centre to `(-70vw, -90vh)`,
 * and the slab nested inside each one repeats that path at `(3vw, 3vh)`. The
 * two compose, so what a reader sees is the picture drifting a little inside
 * its own frame as the frame crosses the screen — the whole of the depth in
 * that effect is those three units.
 */
export const SLAB_TRAVEL_X = 70;
export const SLAB_TRAVEL_Y = 90;
export const PARALLAX_TRAVEL = 3;

/**
 * How many screens this project is from the middle, as a fraction.
 *
 * 0 is centred, +1 is parked off the bottom-right corner waiting its turn, and
 * -1 has left through the top-left. Everything else on this stage is a multiple
 * of this one number, which is why it is worth having on its own.
 */
export function getDiagonalSlot(index: number, progress: number, count: number) {
  if (count <= 1) return 0;
  const bounded = Math.min(1, Math.max(0, progress));
  return index - bounded * (count - 1);
}

/** The frame's own travel: a straight line, as in the reference. */
export function getSlabTransform(slot: number) {
  return { x: slot * SLAB_TRAVEL_X, y: slot * SLAB_TRAVEL_Y };
}

/**
 * The picture's drift inside that frame, eased rather than linear.
 *
 * `inOutQuad` is what the reference gives this layer and not the one above it,
 * and the mismatch is the point: two linear moves would compose into a third
 * linear move and the depth would vanish.
 */
export function getParallaxTransform(slot: number) {
  const eased = easeInOutQuadSigned(Math.max(-1.5, Math.min(1.5, slot)));
  return { x: eased * PARALLAX_TRAVEL, y: eased * PARALLAX_TRAVEL };
}

/**
 * `inOutQuad` mirrored about zero, so it can take the signed slot directly.
 * Applying the plain curve to a negative slot would flip its shape.
 */
export function easeInOutQuadSigned(value: number) {
  const magnitude = Math.abs(value);
  const eased =
    magnitude < 0.5 ? 2 * magnitude * magnitude : 1 - (-2 * magnitude + 2) ** 2 / 2;
  return Math.sign(value) * eased;
}

/**
 * How far the masked rails of numbers and titles have slid, as a percentage of
 * the whole column. Each row is one row-height tall and there are `count` of
 * them, so one project is worth `100 / count` percent.
 */
export function getRailShift(progress: number, count: number) {
  if (count <= 1) return 0;
  const bounded = Math.min(1, Math.max(0, progress));
  const travelled = (bounded * (count - 1) * 100) / count;
  // Negated only when there is something to negate: `-0` is a real value in
  // JavaScript, it survives into the CSS string as `-0%`, and it fails an
  // equality check against zero.
  return travelled === 0 ? 0 : -travelled;
}

/**
 * How far the progress bar has travelled, as a percentage of *its own* height.
 *
 * Deliberately not `getRailShift`: the rails slide a column of `count` rows and
 * so divide by `count`, while the bar is a single block one row tall stepping
 * down a track. Reusing the rails' number here put the bar out by exactly that
 * factor.
 */
export function getProgressBarShift(progress: number, count: number) {
  if (count <= 1) return 0;
  const bounded = Math.min(1, Math.max(0, progress));
  return bounded * (count - 1) * 100;
}

/** Which project the reader has settled on, for the parts that are not motion. */
export function progressToProjectIndex(progress: number, count: number) {
  if (count <= 1) return 0;
  const bounded = Math.min(1, Math.max(0, progress));
  return Math.min(count - 1, Math.round(bounded * (count - 1)));
}
