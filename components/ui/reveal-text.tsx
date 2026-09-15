"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { motion } from "motion/react";

import { useIntroReady } from "@/hooks/use-intro-ready";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";
import { cn } from "@/lib/utils";
import { getIntroRevealItem, revealItem, scrollRevealViewport } from "@/lib/motion";
import { useLanguage } from "@/components/providers/language-provider";

type RevealTextProps = {
  children: ReactNode;
  className?: string;
  as?: "span" | "div" | "p";
  delay?: number;
  trigger?: "viewport" | "intro";
};

export function RevealText({ children, className, as = "span", delay = 0, trigger = "viewport" }: RevealTextProps) {
  const { language } = useLanguage();
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

  /**
   * The clip box carries the caller's classes, and the text inherits them.
   *
   * It used to be the other way round, and the `0.18em` of breathing room then
   * resolved against whatever font size the *parent* happened to have rather
   * than the text's own. Under a heading sized by a `clamp`, that came to
   * 2.88px where it needed 27, and the descenders of "project" were sheared off
   * nine pixels short — the box was doing its job, just at a sixteenth of the
   * size it was asked for.
   *
   * The negative margin still cancels the padding, so nothing about the layout
   * moves; the clip simply reaches past the baseline as far as it always meant
   * to.
   */
  const clipClassName = cn("block overflow-hidden py-[0.18em] -my-[0.18em]", className);

  if (trigger === "intro") {
    return (
      <Wrapper className={clipClassName}>
        <MotionElement
        key={language}
          animate={introReady ? "visible" : "hidden"}
          className="block"
          initial="hidden"
          variants={introVariants}
        >
          {children}
        </MotionElement>
      </Wrapper>
    );
  }

  return (
    <Wrapper className={clipClassName}>
      <MotionElement
        key={language}
        className="block"
        initial="hidden"
        whileInView="visible"
        viewport={scrollRevealViewport}
        variants={revealItem}
      >
        {children}
      </MotionElement>
    </Wrapper>
  );
}
