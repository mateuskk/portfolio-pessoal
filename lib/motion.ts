import { stagger, type Transition, type Variants } from "motion/react";

export const easeOutExpo = [0.22, 1, 0.36, 1] as const;

/**
 * Clamped linear map — the shape `useTransform`'s range form would give.
 *
 * Written out rather than using that form because the range version lets Motion
 * promote a scroll-derived value onto a hardware-accelerated WAAPI animation,
 * and that path mishandles the pinned handover: opacity ended up on an
 * animation stuck at `currentTime: 0` that finished early and snapped the
 * section back to fully opaque just as the stack was covering it.
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
) {
  const t = Math.min(Math.max((value - inMin) / (inMax - inMin), 0), 1);
  return outMin + (outMax - outMin) * t;
}

export const weightedTransition: Transition = {
  duration: 1.1,
  ease: easeOutExpo,
};

/**
 * The viewport gate every scroll-triggered reveal shares.
 *
 * `once: false` is the point: a block re-plays its reveal each time it comes
 * back into view, so scrolling up and back down animates again instead of
 * leaving a page of already-settled text behind.
 *
 * `amount: "some"` gives the gate its hysteresis, and that is what keeps it
 * from flickering — a block opens as soon as any part of it is on screen and
 * only re-arms once every part has left, so no element can sit on the
 * threshold toggling. The re-arm therefore always happens off-screen, which is
 * why the reset is never seen.
 *
 * Reveals driven by the intro or by the hero split's progress do not use this:
 * those are gated on their own state, and the split's gate already reverses.
 */
export const scrollRevealViewport = { once: false, amount: "some" } as const;

export const revealContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: stagger(0.08, { startDelay: 0.06 }),
    },
  },
};

export const revealItem: Variants = {
  hidden: { opacity: 0.08, x: -40, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: weightedTransition,
  },
};

export function getIntroRevealItem(delay = 0): Variants {
  return {
    hidden: { opacity: 0, x: -56, filter: "blur(12px)" },
    visible: {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
      transition: { duration: 1.25, ease: easeOutExpo, delay },
    },
  };
}

export const introRevealItem = getIntroRevealItem();

export const blurInChar: Variants = {
  hidden: { opacity: 0, filter: "blur(5px)" },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: easeOutExpo },
  },
};

export function getBlurInContainer(delay = 0): Variants {
  return {
    hidden: {},
    visible: {
      transition: { delayChildren: stagger(0.018, { startDelay: delay }) },
    },
  };
}

/**
 * GSAP's `power3.out` is a cubic ease-out. Used by the ported Webflow
 * reference animations so their pacing matches the original.
 */
export const easeOutCubic = [0.215, 0.61, 0.355, 1] as const;

/**
 * The symmetric partner to the above, and the curve the loading panels retract
 * on — Webflow calls it `inOutCubic`, which is where this one came from.
 */
export const easeInOutCubic = [0.65, 0, 0.35, 1] as const;

/** Per-character stagger from the reference source (`gsap stagger: 0.05`). */
export const CHAR_STAGGER_MAX = 0.05;
/**
 * Seconds the stagger sweep may occupy, however long the string is. This is
 * the main pacing knob for the About reveal: it sets how long one block takes
 * to sweep, which in turn sets how far apart the call-site delays have to be
 * for the blocks to read as a cascade instead of one simultaneous flash.
 */
export const CHAR_SWEEP_BUDGET = 1.25;
export const CHAR_REVEAL_IN_DURATION = 0.6;
export const CHAR_REVEAL_OUT_DURATION = 0.2;

/**
 * The reference's flat 0.05 stagger takes 5.5s on a 110-character statement
 * and ~9s on a paragraph. Budgeting the sweep keeps short strings identical
 * to the reference (the clamp binds) while long strings settle at a constant
 * beat, so a set of blocks reads as one composition.
 */
export function getCharStagger(charCount: number) {
  return Math.min(CHAR_STAGGER_MAX, CHAR_SWEEP_BUDGET / Math.max(charCount - 1, 1));
}

/** Reference values for the per-word mask reveal (`title.is-5`). */
export const WORD_MASK_STAGGER = 0.05;
export const WORD_MASK_DURATION = 1;
export const WORD_MASK_OUT_DURATION = 0.28;
