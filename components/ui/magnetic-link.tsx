"use client";

import { useState, type PointerEvent } from "react";
import { motion, type HTMLMotionProps, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
import { easeOutExpo } from "@/lib/motion";

type MagneticLinkProps = HTMLMotionProps<"a"> & {
  strength?: number;
};

export function MagneticLink({ className, strength = 8, onPointerMove, onPointerLeave, ...props }: MagneticLinkProps) {
  const reduceMotion = useReducedMotion();
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  function handlePointerMove(event: PointerEvent<HTMLAnchorElement>) {
    onPointerMove?.(event);
    if (reduceMotion || window.matchMedia("(pointer: coarse)").matches) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * strength;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * strength;
    setOffset({ x, y });
  }

  function handlePointerLeave(event: PointerEvent<HTMLAnchorElement>) {
    onPointerLeave?.(event);
    setOffset({ x: 0, y: 0 });
  }

  return (
    <motion.a
      {...props}
      className={cn("focus-ring", className)}
      animate={reduceMotion ? undefined : offset}
      transition={{ duration: 0.35, ease: easeOutExpo }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    />
  );
}
