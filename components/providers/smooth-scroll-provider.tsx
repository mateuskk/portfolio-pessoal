"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";

type SmoothScrollProviderProps = {
  children: ReactNode;
};

type MotionPreference = Pick<MediaQueryList, "matches">;

export function shouldUseSmoothScroll(preference: MotionPreference) {
  return preference.matches;
}

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: no-preference)");
    let lenis: Lenis | null = null;
    let frame = 0;

    const stop = () => {
      window.cancelAnimationFrame(frame);
      lenis?.destroy();
      lenis = null;
    };

    const start = () => {
      if (lenis || !shouldUseSmoothScroll(preference)) return;

      lenis = new Lenis({
        anchors: true,
        autoRaf: false,
        duration: 1.08,
        easing: (time) => Math.min(1, 1.001 - Math.pow(2, -10 * time)),
        smoothWheel: true,
        syncTouch: false,
      });

      const update = (time: number) => {
        lenis?.raf(time);
        frame = window.requestAnimationFrame(update);
      };

      frame = window.requestAnimationFrame(update);
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

  return children;
}
