import { stagger, type Transition, type Variants } from "motion/react";

export const easeOutExpo = [0.22, 1, 0.36, 1] as const;

export const weightedTransition: Transition = {
  duration: 1.1,
  ease: easeOutExpo,
};

export const revealContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: stagger(0.08, { startDelay: 0.06 }),
    },
  },
};

export const revealItem: Variants = {
  hidden: { opacity: 0.08, x: -40, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: weightedTransition,
  },
};

export function getIntroRevealItem(delay = 0): Variants {
  return {
    hidden: { opacity: 0, x: -56, filter: "blur(12px)" },
    visible: {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
      transition: { duration: 1.25, ease: easeOutExpo, delay },
    },
  };
}

export const introRevealItem = getIntroRevealItem();
