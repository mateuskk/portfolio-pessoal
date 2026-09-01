"use client";

import { motion, useReducedMotion } from "motion/react";

import type { NavItem } from "@/content/portfolio";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { easeOutExpo } from "@/lib/motion";

type MobileMenuProps = {
  items: NavItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MobileMenu({ items, open, onOpenChange }: MobileMenuProps) {
  const reduceMotion = useReducedMotion();

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
        className="fixed inset-x-3 bottom-3 top-3 z-[60] flex max-w-none translate-x-0 translate-y-0 flex-col justify-end overflow-hidden rounded-[1.35rem] border border-white/15 bg-ink px-6 pb-8 pt-24 text-paper shadow-2xl md:hidden"
      >
        <DialogTitle className="sr-only">Navigation</DialogTitle>
        <nav aria-label="Mobile navigation">
          <motion.ul
            className="border-t border-white/15"
            initial={reduceMotion ? false : "closed"}
            animate="open"
            variants={{ open: { transition: { delayChildren: 0.08 } }, closed: {} }}
          >
            {items.map((item, index) => (
              <motion.li
                key={item.href}
                className="border-b border-white/15"
                variants={{
                  closed: { opacity: 0.4, y: 24 },
                  open: { opacity: 1, y: 0, transition: { delay: reduceMotion ? 0 : index * 0.055, duration: 0.5, ease: easeOutExpo } },
                }}
              >
                <a
                  href={item.href}
                  className="focus-ring flex items-baseline justify-between py-5 text-[clamp(2.7rem,14vw,5.5rem)] leading-none tracking-[-0.055em]"
                  onClick={() => onOpenChange(false)}
                >
                  <span>{item.label}</span>
                  <span className="text-label text-muted">0{index + 1}</span>
                </a>
              </motion.li>
            ))}
          </motion.ul>
        </nav>
        <p className="mt-8 text-label uppercase text-muted">Menu / Portfolio 2026</p>
      </DialogContent>
    </Dialog>
  );
}
