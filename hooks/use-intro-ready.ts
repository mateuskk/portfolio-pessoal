"use client";

import { useSyncExternalStore } from "react";

import { INTRO_COMPLETE_EVENT, INTRO_SESSION_KEY } from "@/lib/intro";

function subscribe(onChange: () => void) {
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  window.addEventListener(INTRO_COMPLETE_EVENT, onChange);
  preference.addEventListener("change", onChange);

  return () => {
    window.removeEventListener(INTRO_COMPLETE_EVENT, onChange);
    preference.removeEventListener("change", onChange);
  };
}

function getSnapshot() {
  return window.sessionStorage.getItem(INTRO_SESSION_KEY) === "true"
    || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useIntroReady() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
