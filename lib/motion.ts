import { stagger, type Transition, type Variants } from "motion/react";

export const easeOutExpo = [0.22, 1, 0.36, 1] as const;

export const weightedTransition: Transition = {
  duration: 0.8,
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
  hidden: { opacity: 0.35, y: "45%" },
  visible: {
    opacity: 1,
    y: "0%",
    transition: weightedTransition,
  },
};
