"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";
import Lenis from "lenis";

type SmoothScrollProviderProps = {
  children: ReactNode;
};

type MotionPreference = Pick<MediaQueryList, "matches">;

export function shouldUseSmoothScroll(preference: MotionPreference) {
  return preference.matches;
}

/**
 * The running Lenis instance, or `null`.
 *
 * `null` is a real state, not just an initial one: under reduced motion no
 * instance is created at all. Anything built on top of Lenis — the project
 * snapping, for one — therefore switches itself off for those readers without
 * needing a branch of its own.
 */
const LenisContext = createContext<Lenis | null>(null);

export function useLenisInstance() {
  return useContext(LenisContext);
}

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const [instance, setInstance] = useState<Lenis | null>(null);

  useLayoutEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: no-preference)");
    let lenis: Lenis | null = null;
    let frame = 0;

    const stop = () => {
      window.cancelAnimationFrame(frame);
      lenis?.destroy();
      lenis = null;
      setInstance(null);
    };

    const start = () => {
      if (lenis || !shouldUseSmoothScroll(preference)) return;

      lenis = new Lenis({
        anchors: true,
        autoRaf: false,
        // A longer tail gives ordinary page movement more weight without
        // changing the dedicated timing used by section and project snaps.
        duration: 1.9,
        easing: (time) => Math.min(1, 1.001 - Math.pow(2, -10 * time)),
        smoothWheel: true,
        syncTouch: false,
        wheelMultiplier: 0.65,
      });

      const update = (time: number) => {
        lenis?.raf(time);
        frame = window.requestAnimationFrame(update);
      };

      frame = window.requestAnimationFrame(update);
      setInstance(lenis);
    };

    const syncPreference = () => {
      if (shouldUseSmoothScroll(preference)) start();
      else stop();
    };

    syncPreference();
    preference.addEventListener("change", syncPreference);

    return () => {
      preference.removeEventListener("change", syncPreference);
      stop();
    };
  }, []);

  return <LenisContext.Provider value={instance}>{children}</LenisContext.Provider>;
}
