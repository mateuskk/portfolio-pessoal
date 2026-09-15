"use client";

import { useEffect, useId, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";

import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";
import { completeIntro, isIntroComplete, startIntro } from "@/lib/intro";
import { easeInOutCubic, easeOutExpo } from "@/lib/motion";
import { MB_GLYPH, MB_PEN, MB_VIEWBOX } from "@/lib/mb-mark";
import { useCopy } from "@/components/providers/language-provider";

/**
 * The mark is written by hand, the ring closes around it, and then a circular
 * hole opens through the veil while the letters fade. Those last two run
 * together rather than in turn: the mark should be dissolving *as* the site
 * arrives, not before it.
 */
const FILL_MS = 2400;
const OPEN_MS = 1000;
const DONE_AT = FILL_MS + OPEN_MS;

/**
 * A few broad, very faint pools of light and shade. Kept under 7% alpha and
 * larger than the screen: anything stronger stops reading as frosted glass and
 * starts reading as a picture behind the mark.
 */
const VEIL_GRADIENTS = [
  "radial-gradient(70% 55% at 18% 22%, rgb(9 9 9 / 0.07), transparent 72%)",
  "radial-gradient(60% 50% at 82% 74%, rgb(9 9 9 / 0.06), transparent 70%)",
  "radial-gradient(55% 45% at 62% 12%, rgb(255 255 255 / 0.55), transparent 68%)",
  "radial-gradient(45% 40% at 12% 88%, rgb(255 255 255 / 0.45), transparent 66%)",
].join(", ");

/**
 * A single soft highlight, off-centre. It gives the disc a direction of light,
 * which is the whole difference between frosted glass and a flat grey circle.
 */
const DISC_SHEEN =
  "radial-gradient(90% 80% at 32% 24%, rgb(255 255 255 / 0.75), transparent 70%)";

/** Ring geometry, in the units of the 96-square the mark is drawn in. */
const RING_BOX = 96;
const RING_RADIUS = 42;
const RING_WIDTH = 3;

/**
 * The disc fills the ring exactly, out to the inner edge of its stroke.
 *
 * Derived rather than written down twice: the two are a hair's breadth apart
 * and any later change to the stroke would otherwise leave a gap or an overlap
 * that nobody would think to look for.
 */
const DISC_SIZE = `${(((RING_RADIUS - RING_WIDTH / 2) * 2) / RING_BOX) * 100}%`;

/** Milliseconds from the disc settling to the pen touching the paper. */
const PEN_LEAD_MS = 300;
/** How long the writing takes, pen-down to pen-up. */
const PEN_WRITE_MS = 2000;
/**
 * Each stroke starts fractionally before the one before it has finished. A
 * small thing, but it is what stops three strokes reading as three separate
 * events rather than one hand moving.
 */
const PEN_OVERLAP_MS = 110;

/**
 * The intro waits for the main thread before it starts.
 *
 * Hydrating the page and booting the WebGL canvas blocks rendering hard on a
 * cold load — measured here as frozen frames of 191ms, 156ms and then 584ms.
 * An animation started inside a gap like that does not play, it teleports: the
 * clock keeps running while no frames are drawn, so the pen stroke was arriving
 * on screen already 57% written. Waiting for a short run of ordinary frames
 * costs nothing once the thread is free, and is the difference between the mark
 * being written and it simply appearing.
 *
 * `CALM_TIMEOUT_MS` is the giving-up point. On a machine that never settles,
 * an intro that plays roughly is still better than one that never plays.
 */
const CALM_FRAMES = 3;
const CALM_BUDGET_MS = 40;
const CALM_TIMEOUT_MS = 1800;

function useSteadyFrames() {
  const [steady, setSteady] = useState(false);

  useEffect(() => {
    let frame = 0;
    let inARow = 0;
    let last = performance.now();

    const tick = () => {
      const now = performance.now();
      inARow = now - last <= CALM_BUDGET_MS ? inARow + 1 : 0;
      last = now;

      if (inARow >= CALM_FRAMES) {
        setSteady(true);
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    // The floor has to be a timer, not a frame count. A hidden tab suspends
    // requestAnimationFrame entirely, and a wait that only ever ends inside a
    // frame callback would leave the veil up for as long as the tab stayed in
    // the background.
    const giveUp = window.setTimeout(() => setSteady(true), CALM_TIMEOUT_MS);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(giveUp);
    };
  }, []);

  return steady;
}

export type LoadingStage = "filling" | "opening" | "hidden";
export type PenStroke = { delay: number; duration: number };
export type PenPacing = { leadMs: number; overlapMs: number; writeMs: number };

const MB_PACING: PenPacing = {
  leadMs: PEN_LEAD_MS,
  overlapMs: PEN_OVERLAP_MS,
  writeMs: PEN_WRITE_MS,
};

/**
 * Turns stroke lengths into per-stroke delays and durations.
 *
 * The point is a constant pen speed. Give every stroke the same duration and
 * the short ones crawl while the long ones race — the hand visibly speeds up
 * and slows down for no reason. Dividing a single speed out of the total length
 * instead means a stroke takes exactly as long as it is long.
 *
 * Returned in seconds, which is what Motion's transitions want.
 */
export function getPenTiming(
  lengths: number[],
  { leadMs, writeMs, overlapMs }: PenPacing,
): PenStroke[] {
  // Overlapping shortens the wall-clock span, so the strokes have to add up to
  // more than `writeMs` for the writing to still finish when it is meant to.
  const span = writeMs + overlapMs * Math.max(lengths.length - 1, 0);
  const total = lengths.reduce((sum, len) => sum + len, 0);
  const speed = total / span;

  let at = leadMs;
  return lengths.map((len) => {
    const duration = len / speed;
    const delay = at;
    at += duration - overlapMs;
    return { delay: delay / 1000, duration: duration / 1000 };
  });
}

/**
 * The mask that opens the veil.
 *
 * Both gradient stops sit at the same position on purpose — that gives a hard
 * edged circle rather than a soft one — and the percentage is measured against
 * the distance to the farthest corner, so 100% is exactly where the hole has
 * cleared the screen whatever its proportions.
 */
export function getVeilMask(hole: number) {
  return `radial-gradient(circle at 50% 50%, transparent ${hole}%, black ${hole}%)`;
}

export function LoadingScreen() {
  const copy = useCopy();
  const reduceMotion = useReducedMotionPreference();
  const steady = useSteadyFrames();
  const [stage, setStage] = useState<LoadingStage>(() => {
    startIntro();
    return "filling";
  });

  /**
   * Held as a motion value rather than React state. The mask string is rebuilt
   * on every frame of the reveal, and routing that through a re-render would
   * put the whole overlay back through React sixty times a second to change one
   * number.
   */
  const hole = useMotionValue(0);
  const mask = useTransform(hole, getVeilMask);

  useEffect(() => {
    if (reduceMotion || isIntroComplete()) {
      if (reduceMotion) {
        completeIntro();
      }
      return;
    }
    // Held with the animation itself. Started at mount instead, the clock would
    // run through the stall and the veil would open mid-word.
    if (!steady) return;

    const timers = [
      window.setTimeout(() => setStage("opening"), FILL_MS),
      window.setTimeout(() => {
        completeIntro();
        setStage("hidden");
      }, DONE_AT),
    ];

    return () => {
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [reduceMotion, steady]);

  useEffect(() => {
    if (stage !== "opening") return;

    const control = animate(hole, 100, {
      duration: OPEN_MS / 1000,
      ease: easeInOutCubic,
    });
    return () => control.stop();
  }, [hole, stage]);

  if (stage === "hidden" || reduceMotion) return null;
  if (typeof window !== "undefined" && isIntroComplete()) return null;

  return (
    <motion.output
      aria-label={copy.loading}
      className="pointer-events-none fixed inset-0 z-[200]"
      initial={false}
    >
      {/*
        Frosted rather than flat: the hero shows through it faintly, which keeps
        the veil reading as glass over the site instead of a blank screen in
        front of it. The gradients sit on the same element as the colour so the
        mask takes the whole thing away together — painted on a layer of their
        own they would survive the reveal as a ghost over the site.
      */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-paper/90 backdrop-blur-2xl"
        data-testid="loading-veil"
        style={{
          backgroundImage: VEIL_GRADIENTS,
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      />

      <div
        className="absolute inset-0 grid place-items-center"
        data-testid="loading-mark"
      >
        <LoadingMark opening={stage === "opening"} writing={steady} />
      </div>
    </motion.output>
  );
}

function LoadingMark({ opening, writing }: { opening: boolean; writing: boolean }) {
  const circumference = 2 * Math.PI * RING_RADIUS;
  const timings = getPenTiming(
    MB_PEN.map((stroke) => stroke.len),
    MB_PACING,
  );
  // Masks are referenced by id, which is global to the document. Two loaders on
  // one page would otherwise share — and fight over — the same mask.
  const maskId = `mb-pen-${useId()}`;

  return (
    <div className="relative grid size-40 place-items-center sm:size-44">
      <motion.svg
        animate={{ opacity: opening ? 0 : 1 }}
        className="absolute inset-0 -rotate-90"
        initial={false}
        transition={{
          delay: opening ? 0.18 : 0,
          duration: opening ? 0.82 : 0.25,
          ease: easeInOutCubic,
        }}
        viewBox={`0 0 ${RING_BOX} ${RING_BOX}`}
      >
        <circle
          className="text-black/12"
          cx="48"
          cy="48"
          fill="none"
          r={RING_RADIUS}
          stroke="currentColor"
          strokeWidth={RING_WIDTH}
        />
        <motion.circle
          animate={{ strokeDashoffset: writing ? 0 : circumference }}
          className="text-ink"
          cx="48"
          cy="48"
          data-testid="loading-ring"
          fill="none"
          initial={{ strokeDashoffset: circumference }}
          r={RING_RADIUS}
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth={RING_WIDTH}
          style={{ strokeDasharray: circumference }}
          transition={{ duration: FILL_MS / 1000, ease: "linear" }}
        />
      </motion.svg>

      {/*
        Its own pane of frosted glass, a shade brighter than the veil behind it.
        At the veil's own opacity a disc this size would simply disappear — the
        ring would look like it enclosed nothing.
      */}
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        className="relative grid place-items-center rounded-full"
        initial={{ opacity: 0, scale: 0.9 }}
        style={{
          height: DISC_SIZE,
          width: DISC_SIZE,
        }}
        transition={{ duration: 0.5, ease: easeOutExpo }}
      >
        <motion.span
          animate={{ opacity: opening ? 0 : 1 }}
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-paper"
          data-testid="loading-disc"
          initial={false}
          style={{ backgroundImage: DISC_SHEEN }}
          transition={{
            duration: opening ? 0.48 : 0.25,
            ease: easeInOutCubic,
          }}
        />

        <motion.svg
          animate={{ opacity: opening ? 0 : 1, scale: opening ? 0.985 : 1 }}
          className="relative z-10 w-[78%] text-white mix-blend-difference"
          data-testid="loading-mb"
          initial={false}
          transition={{
            delay: opening ? 0.22 : 0,
            duration: opening ? 0.78 : 0.25,
            ease: easeInOutCubic,
          }}
          viewBox={MB_VIEWBOX}
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>MB</title>
          <defs>
            {/*
              userSpaceOnUse, and generously sized. A mask region defaults to
              the bounding box of what it masks plus a tenth — and these pen
              strokes are fat enough to reach past that, which would clip the
              mask and shave the edges off the letters.
            */}
            <mask
              height="330"
              id={maskId}
              maskUnits="userSpaceOnUse"
              width="480"
              x="-80"
              y="-210"
            >
              {MB_PEN.map((stroke, index) => (
                <motion.path
                  animate={{ strokeDashoffset: writing ? 0 : 1 }}
                  d={stroke.d}
                  fill="none"
                  initial={{ strokeDashoffset: 1 }}
                  key={stroke.d}
                  // Normalised, so one dash unit is the whole stroke however
                  // long it happens to be.
                  pathLength={1}
                  stroke="#fff"
                  /*
                    A full-length dash pushed out of view and drawn back in,
                    rather than a dash grown from nothing. A zero-length dash
                    under a round cap is not nothing — it paints a dot, and
                    three dots would sit in the mask punching holes in letters
                    the pen had not reached yet.
                  */
                  strokeDasharray="1 1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={stroke.width}
                  transition={{
                    delay: timings[index].delay,
                    duration: timings[index].duration,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </mask>
          </defs>

          <path d={MB_GLYPH} fill="currentColor" mask={`url(#${maskId})`} />
        </motion.svg>
      </motion.div>
    </div>
  );
}
