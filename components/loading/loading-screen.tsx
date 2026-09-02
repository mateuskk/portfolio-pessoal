"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";

import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";
import { completeIntro, isIntroComplete, startIntro } from "@/lib/intro";
import { easeOutExpo } from "@/lib/motion";

const FILL_DURATION_MS = 2600;
const LEAVE_DURATION_MS = 700;

export type LoadingStage = "hidden" | "filling" | "leaving";

export function getLoadingOverlayAnimation(stage: LoadingStage) {
  return stage === "leaving"
    ? { clipPath: "inset(0 0 100% 0)", opacity: 1 }
    : { clipPath: "inset(0 0 0% 0)", opacity: 1 };
}

export function LoadingScreen() {
  const reduceMotion = useReducedMotionPreference();
  const [stage, setStage] = useState<LoadingStage>(() => {
    startIntro();
    return "filling";
  });

  useEffect(() => {
    if (reduceMotion || isIntroComplete()) {
      if (reduceMotion) {
        completeIntro();
      }
      return;
    }

    const leaveTimer = window.setTimeout(() => setStage("leaving"), FILL_DURATION_MS);
    const doneTimer = window.setTimeout(() => {
      completeIntro();
      setStage("hidden");
    }, FILL_DURATION_MS + LEAVE_DURATION_MS);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(doneTimer);
    };
  }, [reduceMotion]);

  if (stage === "hidden" || reduceMotion) return null;
  if (typeof window !== "undefined" && isIntroComplete()) return null;

  return (
    <motion.output
      aria-label="Loading portfolio"
      className="pointer-events-none fixed inset-0 z-[200] grid place-items-center bg-ink"
      initial={false}
      animate={getLoadingOverlayAnimation(stage)}
      transition={{ duration: LEAVE_DURATION_MS / 1000, ease: easeOutExpo }}
    >
      <LoadingMark filled={stage === "filling" || stage === "leaving"} />
    </motion.output>
  );
}

function LoadingMark({ filled }: { filled: boolean }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative grid size-32 place-items-center sm:size-36">
      <svg viewBox="0 0 96 96" className="absolute inset-0 -rotate-90">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="currentColor" strokeWidth="1" className="text-white/15" />
        <motion.circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          className="text-paper"
          style={{ strokeDasharray: circumference }}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: filled ? 0 : circumference }}
          transition={{ duration: FILL_DURATION_MS / 1000, ease: "linear" }}
        />
      </svg>
      <motion.div
        className="grid size-16 place-items-center rounded-full border border-white/15 sm:size-[4.5rem]"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: easeOutExpo }}
      >
        <span className="font-serif text-xl italic tracking-[-0.02em] text-paper sm:text-2xl">MB</span>
      </motion.div>
    </div>
  );
}
