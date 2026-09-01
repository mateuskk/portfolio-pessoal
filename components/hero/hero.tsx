"use client";

import { Component, lazy, Suspense, useEffect, useState, type ErrorInfo, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

import { MagneticLink } from "@/components/ui/magnetic-link";
import { RevealText } from "@/components/ui/reveal-text";
import type { PortfolioContent } from "@/content/portfolio";
import { easeOutExpo } from "@/lib/motion";
import { HeroFallback } from "./hero-fallback";

const LazyHeroScene = lazy(() => import("./hero-scene").then((module) => ({ default: module.HeroScene })));

type HeroProps = {
  content: Pick<PortfolioContent["person"], "name" | "role" | "location" | "availability">;
};

class HeroSceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {}

  render() {
    return this.state.failed ? <HeroFallback /> : this.props.children;
  }
}

function useHeroSceneAvailability(reduceMotion: boolean | null) {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const update = () => setAvailable(desktop.matches && Boolean(window.WebGLRenderingContext) && !reduceMotion);
    update();
    desktop.addEventListener("change", update);
    return () => desktop.removeEventListener("change", update);
  }, [reduceMotion]);

  return available;
}

export function Hero({ content }: HeroProps) {
  const reduceMotion = useReducedMotion();
  const showWebGL = useHeroSceneAvailability(reduceMotion);
  const words = content.role.trim().split(/\s+/);
  const editorialWord = words.pop() ?? content.role;
  const primaryWords = words.join(" ");

  return (
    <section className="relative isolate grid min-h-svh overflow-hidden px-page pb-10 pt-28 lg:min-h-[100svh] lg:grid-cols-12 lg:grid-rows-[auto_1fr_auto] lg:pb-14 lg:pt-36" aria-labelledby="hero-title">
      <div className="hairline absolute inset-x-page top-24 lg:top-28" />
      <div className="relative z-20 grid gap-5 text-label uppercase lg:col-span-12 lg:grid-cols-12">
        <RevealText as="p" className="lg:col-span-3">Portfolio / 2026</RevealText>
        <RevealText as="p" className="text-muted lg:col-span-4 lg:col-start-9 lg:text-right">
          {content.location}<br />{content.availability}
        </RevealText>
      </div>

      <div className="relative z-20 my-auto py-16 sm:py-20 lg:col-span-10 lg:py-24">
        <RevealText as="p" className="mb-5 text-label uppercase text-muted">{content.name} — Digital craft</RevealText>
        <h1 id="hero-title" className="max-w-[11ch] text-display font-medium leading-[0.82] tracking-[-0.07em]">
          <RevealText>{primaryWords}&nbsp;</RevealText>
          <RevealText>
            <span className="font-serif font-normal italic tracking-[-0.045em]">{editorialWord}</span>
          </RevealText>
        </h1>
        <motion.p
          className="mt-8 max-w-sm text-balance text-base leading-relaxed text-muted sm:max-w-md lg:ml-[50%] lg:text-lg"
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { delay: 0.7, duration: 0.72, ease: easeOutExpo }}
        >
          I shape precise digital experiences where technology, typography, and motion move as one.
        </motion.p>
      </div>

      <div
        data-testid="hero-visual"
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[-18vw] bottom-[8%] top-[18%] z-0 opacity-70 sm:inset-x-[18%] sm:bottom-[2%] sm:top-[15%] lg:inset-y-[9%] lg:left-[43%] lg:right-[-3%] lg:opacity-90"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgb(243_241_234/9%),transparent_58%)]" />
        {showWebGL ? (
          <HeroSceneBoundary>
            <Suspense fallback={<HeroFallback />}>
              <LazyHeroScene />
            </Suspense>
          </HeroSceneBoundary>
        ) : (
          <HeroFallback />
        )}
      </div>

      <div className="relative z-20 grid items-end gap-6 text-label uppercase lg:col-span-12 lg:grid-cols-12">
        <MagneticLink className="group inline-flex w-fit items-center gap-3 lg:col-span-4" href="#projects">
          <span className="grid size-9 place-items-center rounded-full border border-white/25 transition-colors group-hover:bg-paper group-hover:text-ink">↓</span>
          Explore projects
        </MagneticLink>
        <p className="text-muted lg:col-span-3 lg:col-start-10 lg:text-right">Scroll to discover</p>
      </div>

      <div className="absolute bottom-0 left-[33.333%] top-0 hidden w-px bg-white/[0.06] lg:block" />
      <div className="absolute bottom-0 left-[75%] top-0 hidden w-px bg-white/[0.06] lg:block" />
    </section>
  );
}
