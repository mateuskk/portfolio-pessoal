"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";

import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";
import { completeIntro, INTRO_SESSION_KEY } from "@/lib/intro";

const COUNTER_COMPLETE_MS = 875;
const INTRO_DURATION_MS = 1000;
const TICK_MS = 25;

export function LoadingScreen() {
  const reduceMotion = useReducedMotionPreference();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (reduceMotion || window.sessionStorage.getItem(INTRO_SESSION_KEY) === "true") {
      if (reduceMotion) completeIntro();
      return;
    }

    let elapsed = 0;
    const revealTimer = window.setTimeout(() => setVisible(true), 0);
    const progressTimer = window.setInterval(() => {
      elapsed += TICK_MS;
      setProgress(Math.min(99, Math.round((elapsed / COUNTER_COMPLETE_MS) * 100)));
    }, TICK_MS);
    const completeTimer = window.setTimeout(() => {
      window.clearInterval(progressTimer);
      setProgress(100);
    }, COUNTER_COMPLETE_MS);
    const finishTimer = window.setTimeout(() => {
      window.clearInterval(progressTimer);
      completeIntro();
      setVisible(false);
    }, INTRO_DURATION_MS);

    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(completeTimer);
      window.clearTimeout(finishTimer);
      window.clearInterval(progressTimer);
    };
  }, [reduceMotion]);

  if (!visible || reduceMotion) return null;
  if (window.sessionStorage.getItem(INTRO_SESSION_KEY) === "true") return null;

  return (
    <motion.output
      aria-label="Loading portfolio"
      className="pointer-events-none fixed inset-0 z-[200] grid grid-rows-[1fr_auto] bg-ink px-page py-8 text-paper"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
    >
      <div className="grid place-items-center">
        <p className="font-serif text-[clamp(6rem,17vw,18rem)] italic leading-none tracking-[-0.08em] tabular-nums">
          {String(progress).padStart(3, "0")}
        </p>
      </div>
      <div>
        <div className="mb-4 flex justify-between text-label uppercase text-muted-foreground">
          <span>Loading portfolio</span><span>{progress}%</span>
        </div>
        <div className="h-px overflow-hidden bg-white/20">
          <motion.div className="h-full origin-left bg-paper" animate={{ scaleX: progress / 100 }} transition={{ duration: 0.08 }} />
        </div>
      </div>
    </motion.output>
  );
}
