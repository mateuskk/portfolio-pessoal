'use client';

import { useEffect, useRef, useState, type Ref } from 'react';
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionStyle,
} from 'motion/react';

import type { StackGroup } from '@/content/portfolio';
import { useReducedMotionPreference } from '@/hooks/use-reduced-motion-preference';
import { cn } from '@/lib/utils';
import { StackGrid } from './stack-grid';
import { StackMarquee } from './stack-marquee';
import { useCopy } from "@/components/providers/language-provider";

/**
 * How much scroll the section is held for while it slides out of the way.
 * The only pacing control there is: longer means a slower departure.
 */
const SLIDE_DISTANCE = 'h-[100svh]';

/**
 * Smoothed rather than bolted to the wheel, so the slide carries a little
 * weight instead of tracking every notch exactly.
 */
export const STACK_SLIDE_SPRING = { stiffness: 80, damping: 25, mass: 0.5 };

/**
 * Where the section locks, as a sticky `top` offset.
 *
 * Negative, and that is the point. This section is taller than the screen, so
 * pinning it at `top: 0` would hold its first line and bury the rest. Offset by
 * the difference instead and it engages at the moment its *last* line lands on
 * the bottom edge — the reader has just finished it, and it locks there.
 *
 * It has to be a pixel value rather than `bottom: 0`, which would say the same
 * thing far more simply but does not work here: `body` carries
 * `overflow: hidden auto` and is the scroll container, and measured on this
 * page a bottom-stuck box scrolls straight past while a top-stuck one holds.
 *
 * `PIN_DROP` then settles that resting place a little lower than flush.
 *
 * Bottom-aligned, the framing starts mid-band: the first row on screen is cut
 * off by the top edge. Dropping it brings that row fully into view, with the
 * section's closing padding running off the bottom instead — which costs
 * nothing, since there is only padding down there.
 *
 * A share of the screen rather than a count of pixels, so the framing stays
 * proportional rather than drifting as the viewport changes.
 */
export const STACK_PIN_DROP = 0.135;

function getPinOffset(sectionHeight: number, viewportHeight: number) {
  return Math.min(
    0,
    viewportHeight - sectionHeight + viewportHeight * STACK_PIN_DROP,
  );
}

type StackSectionProps = {
  items: string[];
  groups: StackGroup[];
  staticLayout?: boolean;
};

type StackPanelProps = Omit<StackSectionProps, 'staticLayout'> & {
  className?: string;
  id?: string;
  reduceMotion: boolean;
  sectionRef?: Ref<HTMLElement>;
  style?: MotionStyle;
};

/**
 * The visual stack surface without any opinion about how it owns scroll.
 *
 * Both the standalone fallback and the shared desktop scene render this same
 * panel, which keeps the content, spacing, semantics and marquee behaviour in
 * one place while allowing the parent scene to provide its coordinate system.
 */
export function StackPanel({
  className,
  groups,
  id,
  items,
  reduceMotion,
  sectionRef,
  style,
}: StackPanelProps) {
  const copy = useCopy();
  return (
    <motion.section
      className={cn(
        'border-t border-white/15 bg-ink py-24 sm:py-28 lg:py-40',
        className,
      )}
      id={id}
      ref={sectionRef}
      style={style}
    >
      <header className="px-page text-center">
        <div className="text-label uppercase text-muted-foreground">{copy.capabilities}</div>
        <h2 className="mt-5 font-serif text-section leading-[0.9] tracking-[-0.055em]">
          {copy.stackTitle}
        </h2>
      </header>

      <ul aria-label={copy.technologyStack} className="sr-only">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <div className="mt-16 grid gap-3 lg:mt-24">
        {reduceMotion ? (
          <div
            aria-hidden="true"
            className="flex flex-wrap gap-x-7 gap-y-4 border-y border-white/15 px-page py-8"
          >
            {items.map((item) => (
              <span
                className="font-serif text-4xl italic tracking-[-0.04em] sm:text-6xl"
                key={item}
              >
                {item}
              </span>
            ))}
          </div>
        ) : (
          <>
            <StackMarquee items={items} direction={1} />
            <StackMarquee items={[...items].reverse()} direction={-1} />
          </>
        )}
      </div>

      <div className="mt-12 lg:mt-16">
        <StackGrid groups={groups} />
      </div>
    </motion.section>
  );
}

export function StackSection({
  items,
  groups,
  staticLayout = false,
}: StackSectionProps) {
  const reduceMotion = useReducedMotionPreference();
  const ownsNoScroll = reduceMotion || staticLayout;
  const railRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [pinOffset, setPinOffset] = useState(0);
  /** Where the lock engages and how long it holds, in document pixels. */
  const lock = useRef({ start: 0, span: 0 });

  useEffect(() => {
    const section = sectionRef.current;
    const rail = railRef.current;
    if (!section || !rail) return;

    const measure = () => {
      const height = section.getBoundingClientRect().height;
      const offset = getPinOffset(height, window.innerHeight);
      setPinOffset(offset);

      /**
       * The lock engages where the section's natural top reaches its own sticky
       * offset, and holds until it has been pushed to the bottom of its rail.
       *
       * Worked out from the rail rather than read off a spacer. Driving the
       * slide from a sibling element's scroll window looked equivalent and was
       * not: adjusting the framing moves the lock without moving that window,
       * and the two silently drifted apart — far enough that the slide ran out
       * of road and stopped short of leaving the screen.
       */
      lock.current = {
        start: rail.getBoundingClientRect().top + window.scrollY - offset,
        span: Math.max(1, rail.scrollHeight - height),
      };
    };

    measure();
    window.addEventListener('resize', measure);
    // Optional: catches the section changing height without the window doing
    // so — a font landing late, or a band wrapping.
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(measure);
    observer?.observe(section);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  const { scrollY } = useScroll();
  const held = useMotionValue(0);

  useMotionValueEvent(scrollY, 'change', (y) => {
    const { start, span } = lock.current;
    held.set(Math.min(Math.max((y - start) / span, 0), 1));
  });

  const smoothed = useSpring(held, STACK_SLIDE_SPRING);

  /**
   * Holds, slides a full screen to the left, then holds again.
   *
   * The pause at the start stops the section twitching sideways the instant it
   * locks. The one at the end is deliberately short: the reference spends 60%
   * of its rail parked at `-100vw`, which here would be half a screen of
   * scrolling with nothing on it at all — the section gone and the next one not
   * yet arrived.
   */
  const x = useTransform(
    smoothed,
    [0, 0.12, 0.88, 1],
    ['0vw', '0vw', '-100vw', '-100vw'],
  );

  return (
    // Rises over the pinned about — the second half of that handover. The about
    // is held and eased out in `HeroAboutTransition`; this section is opaque and
    // layered above it, so scrolling simply carries it up over the top. `bg-ink`
    // is what makes it opaque: without it the paper about reads through. Both
    // halves are dropped under reduced motion, hence `motion-reduce:mt-0`.
    <div
      className={cn(
        'relative z-10',
        ownsNoScroll ? 'mt-0' : '-mt-[100svh] motion-reduce:mt-0',
      )}
      data-testid="stack-slide-rail"
      ref={railRef}
    >
      <StackPanel
        id="stack"
        /*
          Stuck by its bottom edge, not its top. This section is taller than the
          screen, so holding its top would crop it and strand the inventory
          below the fold — the reason an earlier pin here was taken out. By the
          bottom it scrolls normally until its last line is on screen, and only
          then is it held, with everything already read.
        */
        className={ownsNoScroll ? 'relative' : 'sticky'}
        groups={groups}
        items={items}
        reduceMotion={reduceMotion}
        sectionRef={sectionRef}
        style={ownsNoScroll ? undefined : { top: pinOffset, x }}
      />

      {/* The scroll the slide is spent over. Nothing is drawn here. */}
      {!ownsNoScroll && <div aria-hidden="true" className={SLIDE_DISTANCE} />}
    </div>
  );
}
