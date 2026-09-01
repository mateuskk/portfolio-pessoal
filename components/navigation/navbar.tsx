"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import type { NavItem } from "@/content/portfolio";
import { MagneticLink } from "@/components/ui/magnetic-link";
import { useActiveSection } from "@/hooks/use-active-section";
import { cn } from "@/lib/utils";
import { easeOutExpo } from "@/lib/motion";
import { MobileMenu } from "./mobile-menu";

type NavbarProps = {
  items: NavItem[];
  initials: string;
  email: string;
};

export function Navbar({ items, initials, email }: NavbarProps) {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const activeSection = useActiveSection(items.map((item) => item.href.slice(1)));

  useEffect(() => {
    const updateCompact = () => setCompact(window.scrollY > 40);
    updateCompact();
    window.addEventListener("scroll", updateCompact, { passive: true });
    return () => window.removeEventListener("scroll", updateCompact);
  }, []);

  return (
    <motion.div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 md:px-page md:pt-4"
      initial={reduceMotion ? false : { opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { delay: 0.14, duration: 0.72, ease: easeOutExpo }}
    >
      <motion.nav
        aria-label="Primary navigation"
        data-compact={String(compact)}
        className="pointer-events-auto flex w-full max-w-[76rem] items-center justify-between rounded-full border border-white/15 bg-black/70 px-3 text-label uppercase shadow-[0_16px_60px_rgb(0_0_0/35%)] backdrop-blur-xl md:px-4"
        animate={{ height: compact ? 54 : 64 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.4, ease: easeOutExpo }}
      >
        <MagneticLink href="#main-content" aria-label="Back to top" className="grid size-10 place-items-center rounded-full border border-white/15 font-medium tracking-[-0.02em]">
          {initials}
        </MagneticLink>

        <ul className="hidden items-center gap-1 md:flex">
          {items.map((item) => {
            const isActive = activeSection === item.href.slice(1);
            return (
              <li key={item.href} className="relative">
                <a
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn("focus-ring relative block rounded-full px-4 py-3 transition-colors", isActive ? "text-ink" : "text-muted hover:text-paper")}
                >
                  {isActive && (
                    <motion.span
                      layoutId="navbar-active"
                      className="absolute inset-0 -z-10 rounded-full bg-paper"
                      transition={{ duration: 0.45, ease: easeOutExpo }}
                    />
                  )}
                  <span>{item.label}</span>
                </a>
              </li>
            );
          })}
        </ul>

        <MagneticLink href={`mailto:${email}`} className="hidden items-center gap-2 rounded-full border border-white/15 px-4 py-3 text-muted transition-colors hover:bg-paper hover:text-ink md:inline-flex">
          <span className="size-1.5 rounded-full bg-paper" /> Let&apos;s talk
        </MagneticLink>

        <MobileMenu items={items} open={open} onOpenChange={setOpen} />
      </motion.nav>
    </motion.div>
  );
}
