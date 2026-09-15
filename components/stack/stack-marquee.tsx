"use client";

import { motion, useAnimationFrame, useMotionValue, useScroll, useSpring, useTransform, useVelocity } from "motion/react";

import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";

type StackMarqueeProps = {
  items: string[];
  direction: 1 | -1;
};

export function getMarqueeStep(deltaMs: number, scrollVelocity: number, direction: 1 | -1) {
  const speed = 0.9 + Math.min(Math.abs(scrollVelocity) * 0.0016, 4.1);
  return (deltaMs / 1000) * speed * direction;
}

export function StackMarquee({ items, direction }: StackMarqueeProps) {
  const reduceMotion = useReducedMotionPreference();
  const position = useMotionValue(direction === 1 ? -50 : 0);
  const x = useTransform(position, (value) => `${value}%`);
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 34, stiffness: 170 });

  useAnimationFrame((_time, delta) => {
    if (reduceMotion) return;

    let next = position.get() + getMarqueeStep(delta, velocity.get(), direction);
    if (direction === 1 && next >= 0) next = -50;
    if (direction === -1 && next <= -50) next = 0;
    position.set(next);
  });

  if (reduceMotion) return null;

  return (
    <div className="overflow-hidden border-y border-white/15 py-5 sm:py-7">
      <motion.div aria-hidden="true" className="flex w-max will-change-transform" style={{ x }}>
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 items-center gap-7 pr-7 sm:gap-10 sm:pr-10">
            {items.map((item, index) => (
              <li key={`${copy}-${item}`} className="flex items-center gap-7 whitespace-nowrap sm:gap-10">
                <span className={index % 2 === 0 ? "font-serif text-[clamp(2.8rem,6vw,6.5rem)] italic leading-none tracking-[-0.045em]" : "text-[clamp(2.5rem,5.6vw,6rem)] font-medium leading-none tracking-[-0.065em]"}>
                  {item}
                </span>
                <span className="size-2 rounded-full border border-white/40" />
              </li>
            ))}
          </ul>
        ))}
      </motion.div>
    </div>
  );
}
