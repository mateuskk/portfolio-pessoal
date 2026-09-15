import { describe, expect, it } from 'vitest';

import {
  BADGE_MIN_LENGTH,
  BADGE_OVERSTRETCH,
  BADGE_REST_LENGTH,
  createBadgeState,
  stepBadgePhysics,
  type BadgeDrag,
  type BadgePhysicsState,
} from './badge-physics';

const FRAME = 1000 / 60;

function run(
  state: BadgePhysicsState,
  steps: number,
  drag: BadgeDrag = null,
  deltaMs = FRAME,
) {
  let current = state;
  for (let i = 0; i < steps; i += 1) {
    current = stepBadgePhysics(current, deltaMs, drag);
  }
  return current;
}

describe('stepBadgePhysics', () => {
  it('swings a released badge through vertical and damps it out', () => {
    let state: BadgePhysicsState = { ...createBadgeState(), angle: 0.5 };

    const early: number[] = [];
    const late: number[] = [];
    for (let i = 0; i < 1800; i += 1) {
      state = stepBadgePhysics(state, FRAME, null);
      if (i < 180) early.push(state.angle);
      if (i >= 1620) late.push(state.angle);
    }

    // It genuinely oscillates rather than creeping back to centre.
    expect(Math.min(...early)).toBeLessThan(0);
    // ...and each pass is smaller than the last.
    const amplitude = (values: number[]) => Math.max(...values.map(Math.abs));
    expect(amplitude(late)).toBeLessThan(amplitude(early));
    expect(Math.abs(state.angle)).toBeLessThan(0.5);
  });

  it('never flings the badge — holding it keeps the velocity at zero', () => {
    const state = run(createBadgeState(), 40, { x: 120, y: 150 });

    expect(state.velocity).toBe(0);
  });

  it('follows the pointer all the way out to the side', () => {
    // An earlier version clamped this to 0.4rad, which made the badge stop
    // tracking the pointer after ~88px of travel and read as stuck.
    const state = run(createBadgeState(), 120, { x: 5000, y: 10 });
    expect(state.angle).toBeGreaterThan(1.4);

    const mirrored = run(createBadgeState(), 120, { x: -5000, y: 10 });
    expect(mirrored.angle).toBeLessThan(-1.4);
  });

  it('tracks a pointer dragged sideways at the height of the card', () => {
    // The case that exposed the clamp: a plain sideways drag level with the
    // card. 300px out should be most of the way to 55°, not a hard stop.
    const state = run(createBadgeState(), 120, { x: 300, y: BADGE_REST_LENGTH });

    expect(state.angle).toBeCloseTo(Math.atan2(300, BADGE_REST_LENGTH), 3);
    expect(state.angle).toBeGreaterThan(0.9);
  });

  it('refuses to let the cord be pulled up past its minimum', () => {
    const state = run(createBadgeState(), 120, { x: 0, y: 5 });

    expect(state.length).toBeCloseTo(BADGE_MIN_LENGTH, 4);
  });

  it('gives only a fraction of the pull once past the rest length', () => {
    const overshoot = 200;
    const state = run(createBadgeState(), 120, {
      x: 0,
      y: BADGE_REST_LENGTH + overshoot,
    });

    expect(state.length).toBeCloseTo(
      BADGE_REST_LENGTH + overshoot * BADGE_OVERSTRETCH,
      4,
    );
  });

  it('returns to the rest length after being let go', () => {
    const stretched = run(createBadgeState(), 120, { x: 0, y: 500 });
    expect(stretched.length).toBeGreaterThan(BADGE_REST_LENGTH);

    const settled = run(stretched, 300);
    expect(settled.length).toBeCloseTo(BADGE_REST_LENGTH, 1);
  });

  it('swings at the same rate regardless of refresh rate', () => {
    const start: BadgePhysicsState = { ...createBadgeState(), angle: 0.5 };

    // One second of real time, integrated at 60Hz and at 120Hz.
    const at60 = run(start, 60, null, FRAME);
    const at120 = run(start, 120, null, FRAME / 2);

    // Without normalisation the 120Hz run would be a full half-period ahead.
    expect(at120.angle).toBeCloseTo(at60.angle, 1);
  });
});
