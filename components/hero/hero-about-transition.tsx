'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';

import { AboutSection } from '@/components/about/about-section';
import type { PortfolioContent } from '@/content/portfolio';
import { useIntroReady } from '@/hooks/use-intro-ready';
import { useIsHandheld } from "@/hooks/use-is-handheld";
import { useReducedMotionPreference } from '@/hooks/use-reduced-motion-preference';
import { mapRange } from '@/lib/motion';
import { Hero } from './hero';

const HERO_ENTRANCE_SETTLE_MS = 1700;

/**
 * How far the page keeps scrolling while the about stays locked in place. This
 * is the stretch the about→stack transition will be animated across, the same
 * way the hero split is driven by its own rail above.
 */
const ABOUT_PIN_DISTANCE = 'h-[180svh]';

type HeroSplitReadiness = {
  introReady: boolean;
  visualReady: boolean;
  entranceSettled: boolean;
  reduceMotion: boolean;
};

export function isHeroSplitReady({
  introReady,
  visualReady,
  entranceSettled,
  reduceMotion,
}: HeroSplitReadiness) {
  return reduceMotion || (introReady && visualReady && entranceSettled);
}

type HeroAboutTransitionProps = {
  person: Pick<
    PortfolioContent['person'],
    | 'name'
    | 'initials'
    | 'role'
    | 'intro'
    | 'location'
    | 'availability'
    | 'portrait'
  >;
  about: PortfolioContent['about'];
};

export function HeroAboutTransition({
  person,
  about,
}: HeroAboutTransitionProps) {
  const progressRailRef = useRef<HTMLDivElement>(null);
  const aboutPinRef = useRef<HTMLDivElement>(null);
  const introReady = useIntroReady();
  const reduceMotion = useReducedMotionPreference();
  const handheld = useIsHandheld();
  const [visualReady, setVisualReady] = useState(false);
  const [entranceSettled, setEntranceSettled] = useState(false);
  const [heroObscured, setHeroObscured] = useState(false);
  const markVisualReady = useCallback(() => setVisualReady(true), []);

  useEffect(() => {
    if (reduceMotion || !introReady || !visualReady) return;

    const timer = window.setTimeout(
      () => setEntranceSettled(true),
      HERO_ENTRANCE_SETTLE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [introReady, reduceMotion, visualReady]);

  const transitionReady = isHeroSplitReady({
    introReady,
    visualReady,
    entranceSettled,
    reduceMotion,
  });
  const gatedProgress = useMotionValue(0);
  const { scrollYProgress } = useScroll({
    target: progressRailRef,
    offset: ['start start', 'end end'],
  });
  const splitProgress = useSpring(gatedProgress, {
    stiffness: 170,
    damping: 30,
    mass: 0.75,
    restDelta: 0.0005,
  });
  const panelScale = useTransform(splitProgress, [0, 1], [0, 1]);

  /**
   * The about hands over to the stack the way the reference site does it: the
   * outgoing section is held in place and eased *out* — shrinking slightly,
   * drifting up and fading — while the next section, which is opaque, simply
   * scrolls up over the top of it. Nothing here moves the stack; that is plain
   * layout, see the negative margin on `StackSection`.
   */
  const { scrollYProgress: aboutPinProgress } = useScroll({
    target: aboutPinRef,
    offset: ['start start', 'end end'],
  });
  /**
   * Written as functions rather than `useTransform(value, [in], [out])` on
   * purpose. The range form lets Motion promote a scroll-derived value onto a
   * hardware-accelerated WAAPI animation, and that path mishandles this pin:
   * opacity ended up on an animation stuck at `currentTime: 0` that finished
   * early and snapped the section back to fully opaque just as the stack was
   * covering it. The function form stays a plain computed value, applied
   * inline every frame — which is what the transform was already doing.
   */
  /**
   * The ranges are pinned to where the stack actually is, measured rather than
   * guessed: over this rail its top travels linearly from one rail-span below
   * the fold to the top of the screen, so it first crosses into view at ~0.45
   * and has covered everything at 1. Nothing happens to the about before 0.45
   * — that stretch is the plain hold — and the fade finishes at 0.95, by which
   * point only a sliver is still uncovered.
   */
  const aboutScale = useTransform(() =>
    mapRange(aboutPinProgress.get(), 0.45, 1, 1, 0.92),
  );
  const aboutOpacity = useTransform(() =>
    mapRange(aboutPinProgress.get(), 0.6, 0.95, 1, 0),
  );
  const aboutLift = useTransform(() =>
    mapRange(aboutPinProgress.get(), 0.45, 1, 0, -80),
  );

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    gatedProgress.set(transitionReady ? latest : 0);
  });

  useMotionValueEvent(splitProgress, 'change', (latest) => {
    const obscured = latest >= 0.985;
    setHeroObscured((current) => (current === obscured ? current : obscured));
  });

  useEffect(() => {
    gatedProgress.set(transitionReady ? scrollYProgress.get() : 0);
  }, [gatedProgress, scrollYProgress, transitionReady]);

  /*
    A phone gets the plain stack, the same one a reader who asked for stillness
    gets.

    The split is scroll-driven clipping and transforms over two full screens,
    and measured on a throttled phone it was the most expensive thing on the
    page by a distance: 34 of 53 frames past 32ms while it ran, a median of
    38.9ms, a worst frame of 365ms. Nothing else came close, and it is an
    effect rather than content, so on the device that cannot afford it the
    reader loses an ornament and keeps every word.
  */
  if (reduceMotion || handheld) {
    return (
      <div data-testid="hero-about-transition" data-transition-ready="true">
        <Hero content={person} onVisualReady={markVisualReady} />
        <div className="bg-paper">
          <AboutSection
            tone="paper"
            content={{
              ...about,
              name: person.name,
              initials: person.initials,
              role: person.role,
              portrait: person.portrait,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="hero-about-transition"
      data-transition-ready={String(transitionReady)}
      className="relative isolate bg-ink"
    >
      <div
        ref={progressRailRef}
        data-testid="hero-split-rail"
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[172svh] md:h-[208svh]"
      />

      <div className="sticky top-0 h-svh overflow-hidden">
        <div
          data-testid="hero-sticky-content"
          aria-hidden={heroObscured ? 'true' : undefined}
          inert={heroObscured ? true : undefined}
          className="h-full"
        >
          <Hero
            contained
            content={person}
            onVisualReady={markVisualReady}
            splitProgress={splitProgress}
          />
        </div>

        <motion.span
          aria-hidden="true"
          data-testid="hero-split-panel-top"
          className="pointer-events-none absolute inset-x-0 bottom-[calc(50%-1px)] z-30 h-[calc(50%+1px)] origin-bottom bg-paper will-change-transform"
          style={{ scaleY: panelScale, backfaceVisibility: 'hidden' }}
        />
        <motion.span
          aria-hidden="true"
          data-testid="hero-split-panel-bottom"
          className="pointer-events-none absolute inset-x-0 top-[calc(50%-1px)] z-30 h-[calc(50%+1px)] origin-top bg-paper will-change-transform"
          style={{ scaleY: panelScale, backfaceVisibility: 'hidden' }}
        />
      </div>

      <div className="relative z-40 pt-[14svh] md:pt-[22svh]">
        <div className="relative" data-testid="about-pin-rail" ref={aboutPinRef}>
          {/*
            Once the about arrives it locks to the viewport and holds there for
            the spacer's worth of scrolling. Centred rather than padded because
            the section is taller than a 768px laptop viewport — see the
            `pinned` prop.
          */}
          <div
            className="sticky top-0 flex h-svh items-center overflow-hidden"
            data-testid="about-pin-frame"
          >
            <motion.div
              className="w-full"
              style={{ scale: aboutScale, opacity: aboutOpacity, y: aboutLift }}
            >
              <AboutSection
                pinned
                tone="paper"
                handoverProgress={aboutPinProgress}
                splitProgress={splitProgress}
                content={{
                  ...about,
                  name: person.name,
                  initials: person.initials,
                  role: person.role,
                  portrait: person.portrait,
                }}
              />
            </motion.div>
          </div>
          <div aria-hidden="true" className={ABOUT_PIN_DISTANCE} />
        </div>
      </div>
    </div>
  );
}
