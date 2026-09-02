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
import { useReducedMotionPreference } from '@/hooks/use-reduced-motion-preference';
import { Hero } from './hero';

const HERO_ENTRANCE_SETTLE_MS = 1700;

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
    'name' | 'role' | 'location' | 'availability'
  >;
  about: PortfolioContent['about'];
};

export function HeroAboutTransition({
  person,
  about,
}: HeroAboutTransitionProps) {
  const progressRailRef = useRef<HTMLDivElement>(null);
  const introReady = useIntroReady();
  const reduceMotion = useReducedMotionPreference();
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

  if (reduceMotion) {
    return (
      <div data-testid="hero-about-transition" data-transition-ready="true">
        <Hero content={person} onVisualReady={markVisualReady} />
        <div className="bg-paper">
          <AboutSection
            tone="paper"
            content={{ ...about, availability: person.availability }}
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
          className="pointer-events-none absolute inset-x-0 bottom-1/2 z-30 h-[calc(50%+1px)] origin-bottom bg-paper will-change-transform"
          style={{ scaleY: panelScale, backfaceVisibility: 'hidden' }}
        />
        <motion.span
          aria-hidden="true"
          data-testid="hero-split-panel-bottom"
          className="pointer-events-none absolute inset-x-0 top-1/2 z-30 h-[calc(50%+1px)] origin-top bg-paper will-change-transform"
          style={{ scaleY: panelScale, backfaceVisibility: 'hidden' }}
        />
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-1/2 z-30 h-px -translate-y-1/2 bg-paper"
          animate={{ opacity: transitionReady ? 1 : 0 }}
          transition={{ duration: 0.35 }}
        />
      </div>

      <div className="relative z-40 pt-[8svh] md:pt-[15svh]">
        <AboutSection
          tone="paper"
          content={{ ...about, availability: person.availability }}
        />
      </div>
    </div>
  );
}
