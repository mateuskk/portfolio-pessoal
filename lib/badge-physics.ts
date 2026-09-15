/**
 * Pendulum for the About section's hanging badge.
 *
 * Ported from the reference implementation (xkintaro.com), which runs a plain
 * `requestAnimationFrame` integrator and writes straight to the DOM — no
 * physics engine, no WebGL. Kept as a pure function so the motion can be unit
 * tested: jsdom implements neither `PointerEvent` nor `setPointerCapture`, so
 * driving this through events in a test is not an option.
 *
 * One deliberate departure: the reference integrates per *frame*, so its badge
 * swings about twice as fast on a 120Hz display. Everything here is normalised
 * against a 60fps baseline instead. The constants and the update order are
 * otherwise the reference's, scaled to our longer cord.
 *
 * An earlier version also clamped the drag angle, to keep the swing clear of
 * the section's `overflow-hidden` edge. That was a mistake: `atan2` means the
 * clamp bit after only ~88px of pointer travel, so the badge stopped following
 * the pointer and read as stuck. The reference swings freely and lets the
 * section clip it; so do we.
 */

/**
 * Where the cord is pinned, in the stage's coordinate space. Not necessarily
 * half the stage width, so every consumer measures from this — the drag maths
 * included.
 */
export const BADGE_PIVOT_X = 150;

/** Cord length at rest, and the far end of the allowed vertical travel. */
export const BADGE_REST_LENGTH = 210;
/** Pulling the badge up past this is refused outright (the reference's 54/180). */
export const BADGE_MIN_LENGTH = 63;
/** Past the rest length the cord gives, but only at a fifth of the pull. */
export const BADGE_OVERSTRETCH = 0.2;

/**
 * Gravitational constant. The reference uses 1.2 against a 180px cord; scaling
 * it with the length holds `ω² = k / L` constant, so our longer cord keeps the
 * reference's swing period instead of feeling sluggish.
 */
export const BADGE_GRAVITY = 1.2 * (BADGE_REST_LENGTH / 180);

const DAMPING = 0.995;
const DRAG_SMOOTHING = 0.4;
const LENGTH_RETURN = 0.1;
const FRAME_MS = 1000 / 60;

export type BadgePhysicsState = {
  /** Radians from straight down. Positive swings right. */
  angle: number;
  velocity: number;
  length: number;
};

/** Pointer offset from the pivot, or `null` when nobody is holding the badge. */
export type BadgeDrag = { x: number; y: number } | null;

export function createBadgeState(): BadgePhysicsState {
  return { angle: 0, velocity: 0, length: BADGE_REST_LENGTH };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Frame-rate independent lerp factor: applying `rate` once per 60fps frame,
 * compounded over `frames` frames.
 */
function smoothing(rate: number, frames: number) {
  return 1 - Math.pow(1 - rate, frames);
}

export function stepBadgePhysics(
  state: BadgePhysicsState,
  deltaMs: number,
  drag: BadgeDrag,
): BadgePhysicsState {
  // Cap the catch-up so a backgrounded tab does not resume with one huge step.
  const frames = clamp(deltaMs / FRAME_MS, 0, 2);

  if (drag) {
    // Guard against dividing into a pointer sitting exactly on the pivot.
    const y = Math.max(drag.y, 10);
    const target = Math.atan2(drag.x, y);

    let length = Math.hypot(drag.x, y);
    if (length > BADGE_REST_LENGTH) {
      length = BADGE_REST_LENGTH + (length - BADGE_REST_LENGTH) * BADGE_OVERSTRETCH;
    } else if (length < BADGE_MIN_LENGTH) {
      length = BADGE_MIN_LENGTH;
    }

    const k = smoothing(DRAG_SMOOTHING, frames);
    return {
      angle: state.angle + (target - state.angle) * k,
      length: state.length + (length - state.length) * k,
      // Held means held: releasing drops the badge from where it was left
      // rather than flinging it, which is what makes the settle read as weight.
      velocity: 0,
    };
  }

  const length =
    state.length + (BADGE_REST_LENGTH - state.length) * smoothing(LENGTH_RETURN, frames);
  const acceleration = (-BADGE_GRAVITY / length) * Math.sin(state.angle);
  const velocity =
    (state.velocity + acceleration * frames) * Math.pow(DAMPING, frames);

  return { angle: state.angle + velocity * frames, velocity, length };
}

/** Offset of the badge's hanging point from the pivot, in pixels. */
export function getBadgeOffset(state: BadgePhysicsState) {
  return {
    dx: state.length * Math.sin(state.angle),
    dy: state.length * Math.cos(state.angle),
  };
}
