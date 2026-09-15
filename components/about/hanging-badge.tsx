'use client';

import { useEffect, useMemo, useRef } from 'react';
import { motion, type Variants } from 'motion/react';

import { useIsHandheld } from '@/hooks/use-is-handheld';
import { useReducedMotionPreference } from '@/hooks/use-reduced-motion-preference';
import {
  BADGE_PIVOT_X,
  BADGE_REST_LENGTH,
  createBadgeState,
  getBadgeOffset,
  stepBadgePhysics,
  type BadgeDrag,
} from '@/lib/badge-physics';
import { easeOutCubic } from '@/lib/motion';
import { cn } from '@/lib/utils';

const CARD_WIDTH = 236;
const STAGE_WIDTH = 300;
const STAGE_HEIGHT = 500;

/**
 * Nudged toward the body copy at both desktop breakpoints. The tighter card
 * allows a larger shift on wide screens, while the compact `lg` shift keeps a
 * safe gutter beside the copy on smaller laptops.
 */
const STAGE_SHIFT = 'lg:ms-4 xl:ms-32';

type HangingBadgeProps = {
  name: string;
  initials: string;
  role: string;
  /** Portrait image. Falls back to the initials while it is unset. */
  src?: string | null;
  paper?: boolean;
  revealed?: boolean;
  delay?: number;
};

function getRevealVariants(delay: number): Variants {
  return {
    hidden: {
      opacity: 0,
      y: 26,
      filter: 'blur(12px)',
      transition: { duration: 0.25, ease: easeOutCubic },
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 1.1, ease: easeOutCubic, delay },
    },
  };
}

/**
 * An ID badge on a cord that you can grab, drag and release — it then swings
 * out and settles under gravity. The integrator lives in `lib/badge-physics`;
 * this component owns the DOM writes.
 *
 * The physics writes `transform` on the card imperatively at frame rate, so
 * nothing else may animate that element — the entrance animation is applied to
 * the wrapper instead.
 */
export function HangingBadge({
  name,
  initials,
  role,
  src,
  paper = false,
  revealed = true,
  delay = 0,
}: HangingBadgeProps) {
  const reduceMotion = useReducedMotionPreference();
  const handheld = useIsHandheld();
  const reveal = useMemo(() => getRevealVariants(delay), [delay]);

  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const cordRef = useRef<SVGLineElement>(null);
  const stateRef = useRef(createBadgeState());
  const dragRef = useRef<BadgeDrag>(null);

  useEffect(() => {
    if (reduceMotion || handheld) return;
    const stage = stageRef.current;
    const card = cardRef.current;
    const cord = cordRef.current;
    if (!stage || !card || !cord) return;

    let frame = 0;
    let previous = 0;
    let onscreen = false;

    const draw = () => {
      const { dx, dy } = getBadgeOffset(stateRef.current);
      cord.setAttribute('x2', String(BADGE_PIVOT_X + dx));
      cord.setAttribute('y2', String(dy));
      // Negated, and it has to be. CSS `rotate(a)` takes the card's own down
      // axis (0, 1) to (-sin a, cos a), while the cord points along
      // (sin θ, cos θ); the two line up only at a = -θ. Rotating by +θ leans
      // the card against its own displacement.
      card.style.transform = `translate(${dx}px, ${dy}px) rotate(${-stateRef.current.angle}rad)`;
    };

    const tick = (now: number) => {
      if (!onscreen) {
        frame = 0;
        return;
      }
      const delta = previous ? now - previous : 1000 / 60;
      previous = now;
      stateRef.current = stepBadgePhysics(stateRef.current, delta, dragRef.current);
      draw();
      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (frame) return;
      previous = 0;
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (!frame) return;
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const track = (event: PointerEvent) => {
      const bounds = stage.getBoundingClientRect();
      dragRef.current = {
        // Measured from the pivot, which is not the stage's centre.
        x: event.clientX - bounds.left - BADGE_PIVOT_X,
        y: event.clientY - bounds.top,
      };
    };
    const release = () => {
      dragRef.current = null;
      card.style.cursor = '';
      window.removeEventListener('pointermove', track);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
    };
    const grab = (event: PointerEvent) => {
      card.style.cursor = 'grabbing';
      track(event);
      window.addEventListener('pointermove', track);
      window.addEventListener('pointerup', release);
      window.addEventListener('pointercancel', release);
    };

    card.addEventListener('pointerdown', grab);

    // Idle offscreen. In jsdom the stub observer never reports, so the loop
    // stays dormant through the unit tests rather than ticking on real timers.
    const observer = new IntersectionObserver(
      ([entry]) => {
        onscreen = entry.isIntersecting;
        if (onscreen) start();
        else stop();
      },
      { threshold: 0 },
    );
    observer.observe(stage);

    return () => {
      stop();
      release();
      card.removeEventListener('pointerdown', grab);
      observer.disconnect();
    };
  }, [handheld, reduceMotion]);

  const plate = src ? (
    // eslint-disable-next-line nextjs/no-img-element -- this app runs on vinext; next/image is not installed
    <img
      alt={`${name} — ${role}`}
      className="size-full object-cover object-center"
      src={src}
    />
  ) : (
    <span
      aria-hidden="true"
      // `opacity-30` measured 2.19:1 against the card once the fill became
      // opaque — while it was translucent axe could not resolve the composite
      // and reported it as incomplete rather than failing. Large text still
      // needs 3:1, and 50% clears it.
      className="font-display text-3xl font-semibold tracking-[-0.05em] opacity-50"
    >
      {initials}
    </span>
  );

  const stage = (
    <div
      ref={stageRef}
      className="relative"
      style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT }}
    >
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full overflow-visible"
      >
        <line
          ref={cordRef}
          className={paper ? 'text-black/30' : 'text-white/30'}
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth={2.5}
          x1={BADGE_PIVOT_X}
          x2={BADGE_PIVOT_X}
          y1={0}
          y2={BADGE_REST_LENGTH}
        />
        <circle
          className={paper ? 'text-black/40' : 'text-white/40'}
          cx={BADGE_PIVOT_X}
          cy={0}
          fill="currentColor"
          r={5}
        />
        <circle
          className={paper ? 'text-paper' : 'text-ink'}
          cx={BADGE_PIVOT_X}
          cy={0}
          fill="currentColor"
          r={2}
        />
      </svg>

      <div
        ref={cardRef}
        className={cn(
          'absolute top-0 flex select-none flex-col items-center rounded-2xl border p-7 shadow-xl',
          reduceMotion ? 'cursor-default' : 'cursor-grab',
          // Opaque on purpose. The card gets dragged across the body copy, and
          // a translucent fill let the paragraphs read straight through it.
          // These are the colours the old `bg-white/55` and `bg-white/6`
          // composited to over each tone, so the resting look is unchanged.
          paper ? 'border-black/15 bg-[#faf9f6]' : 'border-white/15 bg-graphite',
        )}
        style={{
          width: CARD_WIDTH,
          // Hung from the pivot, not from the middle of the stage.
          left: BADGE_PIVOT_X,
          marginLeft: -CARD_WIDTH / 2,
          transformOrigin: 'center top',
          touchAction: 'none',
          // Rest pose, so the card is hung correctly before the loop's first
          // frame and for anyone who never gets one.
          transform: `translate(0px, ${BADGE_REST_LENGTH}px)`,
        }}
      >
        <span
          aria-hidden="true"
          className={cn(
            'absolute -top-1 left-1/2 size-2.5 -translate-x-1/2 rounded-full border-2',
            paper ? 'border-black/25 bg-paper' : 'border-white/25 bg-ink',
          )}
        />
        <div className="pointer-events-none flex flex-col items-center">
          <div
            // A circle keeps its centre at the centre of its bounding box under
            // any rotation, so this is the one point a test can rely on being
            // inside the card however far it has swung.
            data-testid="about-badge-face"
            className={cn(
              'mb-5 grid size-40 place-items-center overflow-hidden rounded-full border',
              paper ? 'border-black/15 bg-black/[0.04]' : 'border-white/15 bg-white/[0.06]',
            )}
          >
            {plate}
          </div>
          <span className="text-[0.78rem] font-bold uppercase tracking-[0.2em]">
            {name}
          </span>
          <span
            className={cn(
              // Tracking is tight enough to keep a two-word role on one line
              // inside the card; `text-center` keeps a longer one tidy when it
              // does wrap. Has to clear 4.5:1 at this size — see the axe run.
              'mt-1.5 text-center text-[0.68rem] uppercase tracking-[0.09em]',
              paper ? 'text-black/60' : 'text-paper/60',
            )}
          >
            {role}
          </span>
        </div>
      </div>
    </div>
  );

  /*
    A phone gets the still badge, and loses nothing by it: the stage is
    `hidden lg:block`, so on a narrow screen the pendulum was swinging where
    nobody could see it while still costing a frame loop and a spring per
    frame. There is nothing to drag on a touch screen either.
  */
  if (reduceMotion || handheld) {
    return (
      <div className={cn('relative z-10 mt-10 hidden lg:block', STAGE_SHIFT)} data-testid="about-badge">
        {stage}
      </div>
    );
  }

  return (
    <motion.div
      animate={revealed ? 'visible' : 'hidden'}
      className={cn('relative z-10 mt-10 hidden lg:block', STAGE_SHIFT)}
      data-testid="about-badge"
      initial="hidden"
      variants={reveal}
    >
      {stage}
    </motion.div>
  );
}
