"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";

import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";
import { completeIntro, isIntroComplete, startIntro } from "@/lib/intro";
import { easeOutExpo } from "@/lib/motion";

const FILL_DURATION_MS = 2600;
const LEAVE_DURATION_MS = 900;

export type LoadingStage = "hidden" | "filling" | "leaving";
type LoadingPanelSide = "left" | "right";

export function getLoadingPanelAnimation(side: LoadingPanelSide, stage: LoadingStage) {
  if (stage !== "leaving") return { x: "0%" };
  return { x: side === "left" ? "-101%" : "101%" };
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
      className="pointer-events-none fixed inset-0 z-[200] overflow-hidden"
      initial={false}
    >
      {(["left", "right"] as const).map((side) => (
        <motion.span
          key={side}
          aria-hidden="true"
          data-testid="loading-panel"
          className={`absolute inset-y-0 bg-ink will-change-transform ${
            side === "left" ? "left-0 w-[calc(50%+1px)]" : "right-0 w-[calc(50%+1px)]"
          }`}
          animate={getLoadingPanelAnimation(side, stage)}
          initial={false}
          transition={{ duration: LEAVE_DURATION_MS / 1000, ease: easeOutExpo }}
        />
      ))}

      <motion.div
        className="absolute inset-0 z-10 grid place-items-center"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={stage === "leaving" ? { opacity: 0, scale: 0.97 } : { opacity: 1, scale: 1 }}
        transition={{ duration: stage === "leaving" ? 0.25 : 0.5, ease: easeOutExpo }}
      >
        <LoadingMark filled={stage === "filling" || stage === "leaving"} />
      </motion.div>
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
