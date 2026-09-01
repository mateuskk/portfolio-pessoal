"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import type { NavItem } from "@/content/portfolio";
import { MagneticLink } from "@/components/ui/magnetic-link";
import { useActiveSection } from "@/hooks/use-active-section";
import { cn } from "@/lib/utils";
import { easeOutExpo } from "@/lib/motion";
import { MobileMenu } from "./mobile-menu";

const navbarShell = {
  hidden: { opacity: 0, y: -24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.14,
      duration: 0.42,
      ease: easeOutExpo,
      staggerChildren: 0.055,
      delayChildren: 0.08,
    },
  },
};

const navbarItem = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: easeOutExpo } },
};

const navbarLinks = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.045 } },
};

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
      initial={reduceMotion ? false : "hidden"}
      animate="visible"
    >
      <motion.nav
        aria-label="Primary navigation"
        data-compact={String(compact)}
        className="pointer-events-auto flex h-16 w-full max-w-[76rem] items-center justify-between rounded-full border border-white/15 bg-black/70 px-3 text-label uppercase shadow-[0_16px_60px_rgb(0_0_0/35%)] backdrop-blur-xl transition-[height] duration-[400ms] ease-expo-out data-[compact=true]:h-[54px] md:px-4"
        variants={navbarShell}
      >
        <motion.div variants={navbarItem}>
          <MagneticLink href="#main-content" aria-label="Back to top" className="grid size-10 place-items-center rounded-full border border-white/15 font-medium tracking-[-0.02em]">
            {initials}
          </MagneticLink>
        </motion.div>

        <motion.ul className="hidden items-center gap-1 md:flex" variants={navbarLinks}>
          {items.map((item) => {
            const isActive = activeSection === item.href.slice(1);
            return (
              <motion.li key={item.href} className="relative" variants={navbarItem}>
                <a
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "focus-ring group isolate relative block overflow-hidden rounded-full px-4 py-3 transition-colors",
                    isActive ? "text-ink" : "text-muted hover:text-paper focus-visible:text-paper",
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="navbar-active"
                      className="absolute inset-0 z-0 rounded-full bg-paper"
                      transition={{ duration: 0.45, ease: easeOutExpo }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                  <span
                    aria-hidden="true"
                    data-testid="nav-link-underline"
                    className="absolute inset-x-4 bottom-2 z-10 h-px origin-left scale-x-0 bg-current transition-transform duration-300 ease-expo-out group-hover:scale-x-100 group-focus-visible:scale-x-100"
                  />
                </a>
              </motion.li>
            );
          })}
        </motion.ul>

        <motion.div className="hidden md:block" variants={navbarItem}>
          <MagneticLink href={`mailto:${email}`} className="group inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-3 text-muted transition-colors hover:bg-paper hover:text-ink">
            <span className="size-1.5 rounded-full bg-paper transition-colors group-hover:bg-ink" /> Let&apos;s talk
          </MagneticLink>
        </motion.div>

        <motion.div className="md:hidden" variants={navbarItem}>
          <MobileMenu items={items} open={open} onOpenChange={setOpen} />
        </motion.div>
      </motion.nav>
    </motion.div>
  );
}
