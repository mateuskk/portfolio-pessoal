"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { motion } from "motion/react";

import { useIntroReady } from "@/hooks/use-intro-ready";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";
import { cn } from "@/lib/utils";
import { getIntroRevealItem, revealItem } from "@/lib/motion";

type RevealTextProps = {
  children: ReactNode;
  className?: string;
  as?: "span" | "div" | "p";
  delay?: number;
  trigger?: "viewport" | "intro";
};

export function RevealText({ children, className, as = "span", delay = 0, trigger = "viewport" }: RevealTextProps) {
  const [mounted, setMounted] = useState(false);
  const introReady = useIntroReady();
  const reduceMotion = useReducedMotionPreference();
  const introVariants = useMemo(() => getIntroRevealItem(delay), [delay]);

  useEffect(() => setMounted(true), []);

  const staticClassName = cn("block", className);
  if (reduceMotion || (trigger === "viewport" && !mounted)) {
    const StaticElement = as;
    return <StaticElement className={staticClassName}>{children}</StaticElement>;
  }

  const MotionElement = motion[as];
  const Wrapper = as === "span" ? "span" : "div";

  if (trigger === "intro") {
    return (
      <Wrapper className="block overflow-hidden py-[0.18em] -my-[0.18em]">
        <MotionElement
          animate={introReady ? "visible" : "hidden"}
          className={staticClassName}
          initial="hidden"
          variants={introVariants}
        >
          {children}
        </MotionElement>
      </Wrapper>
    );
  }

  return (
    <Wrapper className="block overflow-hidden py-[0.18em] -my-[0.18em]">
      <MotionElement
        className={staticClassName}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: "some" }}
        variants={revealItem}
      >
        {children}
      </MotionElement>
    </Wrapper>
  );
}
