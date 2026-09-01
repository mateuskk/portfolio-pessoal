"use client";

import { useState, type PointerEvent } from "react";
import { motion, type HTMLMotionProps } from "motion/react";

import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";
import { cn } from "@/lib/utils";
import { easeOutExpo } from "@/lib/motion";

type MagneticLinkProps = HTMLMotionProps<"a"> & {
  strength?: number;
};

type MagneticBounds = Pick<DOMRect, "left" | "top" | "width" | "height">;

export function getMagneticOffset(clientX: number, clientY: number, bounds: MagneticBounds, strength: number) {
  const clamp = (value: number) => Math.max(-8, Math.min(8, value));
  return {
    x: clamp(((clientX - bounds.left) / bounds.width - 0.5) * strength),
    y: clamp(((clientY - bounds.top) / bounds.height - 0.5) * strength),
  };
}

export function MagneticLink({ className, strength = 8, onPointerMove, onPointerLeave, ...props }: MagneticLinkProps) {
  const reduceMotion = useReducedMotionPreference();
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  function handlePointerMove(event: PointerEvent<HTMLAnchorElement>) {
    onPointerMove?.(event);
    if (reduceMotion || window.matchMedia("(pointer: coarse)").matches) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    setOffset(getMagneticOffset(event.clientX, event.clientY, bounds, strength));
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
