"use client";

import { Component, lazy, Suspense, useEffect, useRef, useState, type ErrorInfo, type ReactNode } from "react";

import { MagneticLink } from "@/components/ui/magnetic-link";
import { RevealText } from "@/components/ui/reveal-text";
import type { PortfolioContent } from "@/content/portfolio";
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

function useHeroSceneAvailability() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setAvailable(desktop.matches && !motionPreference.matches && Boolean(window.WebGLRenderingContext));
    update();
    desktop.addEventListener("change", update);
    motionPreference.addEventListener("change", update);
    return () => {
      desktop.removeEventListener("change", update);
      motionPreference.removeEventListener("change", update);
    };
  }, []);

  return available;
}

function useInView(active: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const node = ref.current;
    if (!active || !node) return;

    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [active]);

  return { ref, inView };
}

export function Hero({ content }: HeroProps) {
  const showWebGL = useHeroSceneAvailability();
  const { ref: visualRef, inView } = useInView(showWebGL);
  const words = content.role.trim().split(/\s+/);
  const editorialWord = words.pop() ?? content.role;
  const primaryWords = words.join(" ");

  return (
    <section className="relative isolate grid min-h-svh overflow-hidden px-page pb-10 pt-28 lg:min-h-[100svh] lg:grid-cols-12 lg:grid-rows-[auto_1fr_auto] lg:pb-14 lg:pt-36" aria-labelledby="hero-title">
      <div className="hairline absolute inset-x-page top-24 lg:top-28" />

      <div className="relative z-20 my-auto py-16 sm:py-20 lg:col-span-10 lg:py-24">
        <RevealText as="p" className="mb-5 text-label uppercase text-muted-foreground">{content.name}</RevealText>
        <h1 id="hero-title" className="max-w-[11ch] text-display font-medium leading-[0.82] tracking-[-0.07em]">
          <RevealText>{primaryWords}&nbsp;</RevealText>
          <RevealText>
            <span className="font-serif font-normal italic tracking-[-0.045em]">{editorialWord}</span>
          </RevealText>
        </h1>
        <RevealText
          as="p"
          className="mt-8 max-w-sm text-balance text-base leading-relaxed text-muted-foreground sm:max-w-md lg:ml-[50%] lg:text-lg"
        >
          I shape precise digital experiences where technology, typography, and motion move as one.
        </RevealText>
      </div>

      <div
        ref={visualRef}
        data-testid="hero-visual"
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[-18vw] bottom-[8%] top-[18%] z-0 opacity-70 sm:inset-x-[18%] sm:bottom-[2%] sm:top-[15%] lg:inset-y-[9%] lg:left-[43%] lg:right-[-3%] lg:opacity-90"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgb(243_241_234/9%),transparent_58%)]" />
        {showWebGL ? (
          <HeroSceneBoundary>
            <Suspense fallback={<HeroFallback />}>
              <LazyHeroScene inView={inView} />
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
      </div>
    </section>
  );
}
