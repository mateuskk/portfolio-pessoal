"use client";

import { useRef, useState } from "react";
import { useMotionValueEvent, useScroll } from "motion/react";

export function progressToProjectIndex(progress: number, count: number) {
  if (count <= 1) return 0;

  const boundedProgress = Math.min(1, Math.max(0, progress));
  return Math.min(count - 1, Math.floor(boundedProgress * count));
}

export function useProjectProgress(count: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    setActiveIndex(progressToProjectIndex(progress, count));
  });

  return { activeIndex, containerRef, scrollYProgress };
}
