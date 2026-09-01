"use client";

import { useEffect, useState } from "react";

export function useReducedMotionPreference() {
  const [reduceMotion, setReduceMotion] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = (event?: MediaQueryListEvent) => setReduceMotion(event?.matches ?? preference.matches);

    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  return reduceMotion;
}
