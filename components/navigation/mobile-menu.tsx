"use client";

import type { CSSProperties } from "react";
import { motion, stagger } from "motion/react";

import type { NavItem } from "@/content/portfolio";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";
import { easeOutExpo } from "@/lib/motion";

type MobileMenuProps = {
  items: NavItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function getMobileMenuMotionStyle(reduceMotion: boolean | null): CSSProperties | undefined {
  return reduceMotion ? { clipPath: "none", transitionDuration: "0ms" } : undefined;
}

export function MobileMenu({ items, open, onOpenChange }: MobileMenuProps) {
  const reduceMotion = useReducedMotionPreference();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            className="relative z-[70] grid size-10 place-items-center rounded-full border border-white/15 bg-ink text-paper md:hidden"
          />
        }
      >
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        <span aria-hidden="true" className="relative block h-3.5 w-4">
          <motion.span
            className="absolute left-0 top-1 block h-px w-4 bg-current"
            animate={open ? { y: 3, rotate: 45 } : { y: 0, rotate: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.35, ease: easeOutExpo }}
          />
          <motion.span
            className="absolute bottom-1 left-0 block h-px w-4 bg-current"
            animate={open ? { y: -3, rotate: -45 } : { y: 0, rotate: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.35, ease: easeOutExpo }}
          />
        </span>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        style={getMobileMenuMotionStyle(reduceMotion)}
        className="fixed inset-x-0 bottom-0 top-[4.75rem] z-[60] flex max-w-none translate-x-0 translate-y-0 flex-col justify-end overflow-hidden rounded-none border-x-0 border-b-0 border-white/15 bg-ink px-6 pb-8 pt-16 text-paper shadow-2xl ring-0 transition-[clip-path,opacity] duration-500 ease-expo-out data-open:animate-none data-closed:animate-none data-starting-style:opacity-80 data-ending-style:opacity-80 data-starting-style:[clip-path:inset(0_0_100%_0)] data-ending-style:[clip-path:inset(0_0_100%_0)] md:hidden"
      >
        <DialogTitle className="sr-only">Navigation</DialogTitle>
        <nav aria-label="Mobile navigation">
          <motion.ul
            className="border-t border-white/15"
            initial={reduceMotion ? false : "closed"}
            animate={open ? "open" : "closed"}
            variants={{
              open: { transition: { delayChildren: stagger(0.055, { startDelay: 0.08 }) } },
              closed: { transition: { delayChildren: stagger(0.035, { from: "last" }) } },
            }}
          >
            {items.map((item) => (
              <motion.li
                key={item.href}
                className="border-b border-white/15"
                variants={{
                  closed: { opacity: 0.35, y: reduceMotion ? 0 : 24, transition: { duration: reduceMotion ? 0 : 0.25 } },
                  open: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0 : 0.42, ease: easeOutExpo } },
                }}
              >
                <a
                  href={item.href}
                  className="focus-ring block py-5 text-[clamp(2.7rem,14vw,5.5rem)] leading-none tracking-[-0.055em]"
                  onClick={() => onOpenChange(false)}
                >
                  {item.label}
                </a>
              </motion.li>
            ))}
          </motion.ul>
        </nav>
        <p className="mt-8 text-label uppercase text-muted-foreground">Menu / Portfolio 2026</p>
      </DialogContent>
    </Dialog>
  );
}
