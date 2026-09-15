/**
 * The cover that hides a jump between sections.
 *
 * One outline — not a stack of panels — rebuilt every frame from a single
 * number running 0 → 2. Below 1 it is the region under a rising top edge; above
 * 1 it is the region above a rising bottom edge. So the same value covers the
 * screen and then clears it, and the two halves cannot drift apart.
 *
 * Coordinates are fractions of the covered element's own box, which is what
 * `clipPathUnits="objectBoundingBox"` wants. That is not a detail: the visible
 * surface is a frosted pane, and frosting comes from `backdrop-filter`, which
 * an SVG `fill` cannot carry. So the shape clips a real element rather than
 * being painted, and clipping in box fractions is what keeps one set of numbers
 * describing any viewport.
 */

/**
 * The shape starts and ends past the edge of the box.
 *
 * At the extremes the bowed edge would otherwise cut a visible chord across the
 * corner: the curve's ends sit on the boundary while its middle is `ARC_BULGE`
 * beyond it. Overshooting parks that whole excursion out of frame.
 */
const ARC_OVERSHOOT = 1.1;

/**
 * How far the leading edge bows away from a straight line, as a fraction of the
 * box — so 30% of the screen's height at its deepest.
 *
 * This is the whole character of the movement. The bulge is scaled by
 * `sin(pi * t)`, which is zero at both ends and peaks halfway, so the edge
 * leaves flat, swells as it crosses, and lands flat. A straight edge reads as a
 * panel sliding; this reads as a sheet being drawn across.
 */
export const ARC_BULGE = 0.3;


/** Milliseconds for each sweep: one to cover, one to clear. */
export const ARC_COVER_MS = 800;
/** Milliseconds the destination's name holds on the covered screen. */
export const ARC_HOLD_MS = 800;
/**
 * How the glass thickens to hide the cut, and thins again afterwards.
 *
 * The move underneath happens in one frame, and through a translucent cover
 * that frame is visible as a jump cut. Going solid just before it and easing
 * back after turns the same instant into the destination coming through the
 * glass. The delay on the way out is what keeps the cut itself from being
 * anywhere near the moment the backdrop becomes readable again.
 */
export const ARC_SOLID_IN_MS = 250;
export const ARC_SOLID_OUT_MS = 420;
export const ARC_SOLID_OUT_DELAY_MS = 180;

/** Strong in-out. The sweep should leave and arrive slowly and cross fast. */
export const ARC_EASE = [0.7, 0, 0.3, 1] as const;

/**
 * How much of the outgoing section is left showing above the destination.
 *
 * Zero, and deliberately so. `section[id]` carries a `scroll-margin-top` for
 * ordinary anchor jumps, where it stops the navbar covering a section's first
 * line — but every section here already opens with far more padding than the
 * navbar is tall, so honouring it as well only pushed the content down and left
 * a band of the previous section stranded across the top of the screen. Behind
 * a cover the reader has no sense of travel to preserve either: the section
 * should simply be there, filling the frame.
 */
export const ARC_LANDING_GAP = 0;

/** Total wall time of a transition, which the caller needs for its own timers. */
export const ARC_TOTAL_MS = ARC_COVER_MS * 2 + ARC_HOLD_MS;

/**
 * The cover's outline at a given progress.
 *
 * `0` is off the bottom, `1` is covering, `2` is off the top. Values are
 * clamped rather than trusted: a spring or a cancelled animation can overshoot,
 * and past the ends the formulae start describing a shape that is inside out.
 */
export function getArcPath(progress: number) {
  const t = Math.min(Math.max(progress, 0), 2);

  if (t <= 1) {
    // Rising: everything below a bowed top edge.
    const edge = ARC_OVERSHOOT - ARC_OVERSHOOT * t;
    const control = edge - ARC_BULGE * Math.sin(t * Math.PI);
    return `M 0 ${round(edge)} Q 0.5 ${round(control)} 1 ${round(edge)} L 1 ${ARC_OVERSHOOT} L 0 ${ARC_OVERSHOOT} Z`;
  }

  // Clearing: everything above a bowed bottom edge, which rises the same way.
  const t2 = t - 1;
  const edge = ARC_OVERSHOOT - ARC_OVERSHOOT * t2;
  const control = edge - ARC_BULGE * Math.sin(t2 * Math.PI);
  return `M 0 0 L 1 0 L 1 ${round(edge)} Q 0.5 ${round(control)} 0 ${round(edge)} Z`;
}

/**
 * Five decimals is far finer than a screen pixel once scaled up, and it keeps
 * exponent notation out of the string. `sin(pi)` does
 * not land on zero in floating point, so the turn would otherwise emit
 * `-3.67e-15`: legal in a path, but a needlessly brittle thing to rebuild sixty
 * times a second and hand to a parser.
 */
function round(value: number) {
  return Math.round(value * 100000) / 100000;
}

/**
 * Where the page should land for a section, matching what the browser would do
 * for the same anchor.
 *
 * The offset is not decoration: `section[id]` carries `scroll-margin-top`, so
 * jumping to the element's raw position would bury its first line under the
 * navbar. Reading it from the element rather than repeating the number here
 * means the two cannot disagree.
 */
export function getSectionScrollTarget(
  elementTop: number,
  scrollY: number,
  scrollMarginTop: number,
) {
  return Math.max(0, elementTop + scrollY - scrollMarginTop);
}
