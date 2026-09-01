"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion } from "motion/react";

import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";
import { cn } from "@/lib/utils";
import { revealItem } from "@/lib/motion";

type RevealTextProps = {
  children: ReactNode;
  className?: string;
  as?: "span" | "div" | "p";
};

export function RevealText({ children, className, as = "span" }: RevealTextProps) {
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotionPreference();

  useEffect(() => setMounted(true), []);

  const staticClassName = cn("block", className);
  if (!mounted || reduceMotion) {
    const StaticElement = as;
    return <StaticElement className={staticClassName}>{children}</StaticElement>;
  }

  const MotionElement = motion[as];
  const Wrapper = as === "span" ? "span" : "div";
  return (
    <Wrapper className="block overflow-hidden">
      <MotionElement
        className={staticClassName}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.65 }}
        variants={revealItem}
      >
        {children}
      </MotionElement>
    </Wrapper>
  );
}
