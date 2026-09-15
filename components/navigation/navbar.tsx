"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue } from "motion/react";

import type { NavItem } from "@/content/portfolio";
import { MagneticLink } from "@/components/ui/magnetic-link";
import { useActiveSection } from "@/hooks/use-active-section";
import { useIntroReady } from "@/hooks/use-intro-ready";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";
import { useArcReveal, useArcRevealPhase } from "@/components/navigation/arc-reveal";
import { LanguageSwitch } from "@/components/navigation/language-switch";
import { cn } from "@/lib/utils";
import { MB_GLYPH, MB_VIEWBOX } from "@/lib/mb-mark";
import { easeOutExpo } from "@/lib/motion";
import { MobileMenu } from "./mobile-menu";
import { useCopy } from "@/components/providers/language-provider";

const getNavbarShell = (reduceMotion: boolean) => ({
  hidden: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: reduceMotion ? 0 : 0.14,
      duration: reduceMotion ? 0 : 0.42,
      ease: easeOutExpo,
      staggerChildren: reduceMotion ? 0 : 0.055,
      delayChildren: reduceMotion ? 0 : 0.08,
    },
  },
});

const getNavbarItem = (reduceMotion: boolean) => ({
  hidden: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0 : 0.42, ease: easeOutExpo } },
});

const getNavbarLinks = (reduceMotion: boolean) => ({
  hidden: {},
  visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.045 } },
});

export function getNavbarMotionState(reduceMotion: boolean, introReady: boolean) {
  return { initial: false as const, animate: reduceMotion || introReady ? "visible" as const : "hidden" as const };
}

/**
 * How far up the bar travels to get out of the way.
 *
 * A share of its own height rather than a pixel count, so it clears itself at
 * every breakpoint — the pill and its padding are not the same height on a
 * phone as on a desktop, and a fixed number that just clears one leaves a
 * sliver showing on the other.
 */
export const NAVBAR_HIDDEN_Y = "-120%";

/**
 * The bar only gets out of the way once there is something behind it worth
 * reading. Near the top of the page it stays put, so the first scroll of a
 * visit does not make it flicker away and back.
 */
export const NAVBAR_HIDE_AFTER = 100;

export const NAVBAR_SLIDE = { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } as const;

/**
 * What the cover says on the way back to the top.
 *
 * The monogram's own name is the initials, which is what the bar shows and what
 * its label reads — but "MB" held at display size on a covered screen names the
 * person, not the destination. Every other stop on the bar names where you are
 * going, so this one does too.
 */
export const NAVBAR_HOME_LABEL = "Home";

/**
 * Whether the bar should be out of the way, given where the page was and where
 * it is now.
 *
 * Going down hides it, going up brings it back — the direction is the whole
 * rule, which is why it is the previous position that decides and not a
 * threshold on the current one.
 */
export function shouldHideNavbar(previousY: number, currentY: number) {
  return currentY > previousY && currentY > NAVBAR_HIDE_AFTER;
}

export function getNavbarActiveTransition(reduceMotion: boolean) {
  return reduceMotion ? { duration: 0 } : { duration: 0.45, ease: easeOutExpo };
}

export function getNavbarInteractionProps(reduceMotion: boolean, introReady: boolean) {
  return reduceMotion || introReady ? {} : { "aria-hidden": true, inert: true };
}

type NavbarProps = {
  items: NavItem[];
  initials: string;
};

export function Navbar({ items, initials }: NavbarProps) {
  const navigateWithArc = useArcReveal();
  const arcPhase = useArcRevealPhase();
  const reduceMotion = useReducedMotionPreference();
  const introReady = useIntroReady();
  const copy = useCopy();
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const [hidden, setHidden] = useState(false);
  const activeSection = useActiveSection(items.map((item) => item.href.slice(1)));
  // Nothing selected means the reader is above the first section: the hero.
  const atHero = activeSection === null;

  /**
   * Driven through motion values rather than the `animate` prop, which is
   * already spoken for: it carries the variant name that plays the intro, and
   * the children take their stagger from it. Reusing it here would replay that
   * whole entrance, one bar item at a time, on every upward scroll.
   */
  // Started as a percentage string, because that is the unit it travels in.
  const slideY = useMotionValue("0%");
  const slideOpacity = useMotionValue(1);

  const lastScrollY = useRef(0);
  /**
   * Held in a ref, and written from an effect rather than during render.
   *
   * The scroll handler is registered once, so reading these as values would
   * close over whatever they were on the first render and never see them
   * change.
   */
  const frozen = useRef(false);
  useEffect(() => {
    frozen.current = open || arcPhase !== "idle" || reduceMotion;
  }, [arcPhase, open, reduceMotion]);

  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY;
      setCompact(current > 40);

      /**
       * Frozen while the mobile menu is open — hiding the bar out from under an
       * open menu is absurd — and while a section transition is running, where
       * the page is moved behind a cover. That move is a jump of thousands of
       * pixels in one frame; read as a gesture it would be the hardest scroll
       * down the reader never made, and the bar would be gone on arrival.
       */
      if (!frozen.current) setHidden(shouldHideNavbar(lastScrollY.current, current));
      lastScrollY.current = current;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const away = hidden && !open && !reduceMotion;

  useEffect(() => {
    const controls = [
      animate(slideY, away ? NAVBAR_HIDDEN_Y : "0%", NAVBAR_SLIDE),
      animate(slideOpacity, away ? 0 : 1, NAVBAR_SLIDE),
    ];
    return () => {
      for (const control of controls) control.stop();
    };
  }, [away, slideOpacity, slideY]);

  return (
    <motion.div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 md:px-page md:pt-4"
      data-testid="navbar-shell"
      // Tabbing into a bar that has slid away would leave a keyboard reader
      // working an invisible menu, so reaching it brings it back.
      onFocusCapture={() => setHidden(false)}
      style={{ opacity: slideOpacity, y: slideY }}
      {...getNavbarMotionState(reduceMotion, introReady)}
    >
      <motion.nav
        aria-label={copy.primaryNavigation}
        data-compact={String(compact)}
        data-reduced-motion={String(reduceMotion)}
        {...getNavbarInteractionProps(reduceMotion, introReady)}
        className="pointer-events-auto flex h-16 w-full max-w-[76rem] items-center justify-between rounded-full border border-white/15 bg-black/70 px-3 text-label uppercase shadow-[0_16px_60px_rgb(0_0_0/35%)] backdrop-blur-xl transition-[height] duration-[400ms] ease-expo-out data-[compact=true]:h-[54px] md:px-4"
        variants={getNavbarShell(reduceMotion)}
      >
        <motion.div variants={getNavbarItem(reduceMotion)}>
          <MagneticLink
            href="#main-content"
            aria-label={copy.backToTop}
            onClick={(event) => {
              /**
               * The monogram is the way back to the top, so it gets the same
               * cover as the section links — the climb home crosses every
               * handover on the page, and those are exactly what the cover
               * exists to hide.
               *
               * `atHero` is its version of the rule the links follow: already
               * there, there is no journey to hide, so the anchor is left to
               * its own plain job.
               */
              if (atHero) return;
              if (navigateWithArc("#main-content", copy.home)) event.preventDefault();
            }}
            className={cn(
              "focus-ring relative isolate grid size-10 [@media(pointer:coarse)]:size-11 place-items-center overflow-hidden rounded-full border transition-colors",
              atHero ? "border-transparent text-ink" : "border-white/15 text-paper",
            )}
          >
            {/*
              The same `layoutId` the section links use, so there is one
              selection on the bar and it travels: leaving the hero slides it
              off the monogram and onto About rather than cross-fading two.
            */}
            {atHero && (
              <motion.span
                aria-hidden="true"
                className="absolute inset-0 z-0 rounded-full bg-paper"
                layoutId="navbar-active"
                transition={getNavbarActiveTransition(reduceMotion)}
              />
            )}
            <svg
              className="relative z-10 w-[64%]"
              data-testid="navbar-monogram"
              viewBox={MB_VIEWBOX}
            >
              <title>{initials}</title>
              <path d={MB_GLYPH} fill="currentColor" />
            </svg>
          </MagneticLink>
        </motion.div>

        <motion.ul className="hidden items-center gap-1 md:flex" variants={getNavbarLinks(reduceMotion)}>
          {items.map((item) => {
            const isActive = activeSection === item.href.slice(1);
            return (
              <motion.li key={item.href} className="relative" variants={getNavbarItem(reduceMotion)}>
                <a
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  onClick={(event) => {
                    /**
                     * Already here: there is no journey to hide, so the cover
                     * would be two and a half seconds of theatre over a page
                     * that barely moves. The anchor is left to scroll to the
                     * section's start on its own.
                     */
                    if (isActive) return;
                    if (navigateWithArc(item.href, item.label)) event.preventDefault();
                  }}
                  className={cn(
                    "focus-ring group isolate relative block overflow-hidden rounded-full px-4 py-3 transition-colors",
                    isActive ? "text-ink" : "text-muted-foreground hover:text-paper focus-visible:text-paper",
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="navbar-active"
                      className="absolute inset-0 z-0 rounded-full bg-paper"
                      transition={getNavbarActiveTransition(reduceMotion)}
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

        {/*
          Where "Let's talk" used to be. The address it pointed at is the
          headline of the contact section, a click away on the bar itself, so
          nothing became unreachable by retiring it.
        */}
        <motion.div className="hidden md:block" variants={getNavbarItem(reduceMotion)}>
          <LanguageSwitch />
        </motion.div>

        {/*
          The language sits beside the menu rather than inside it, so it can be
          reached without opening anything. On a phone the bar has room for
          exactly these two, and burying a setting one level down is how it
          stops being found.
        */}
        <motion.div className="flex items-center gap-2 md:hidden" variants={getNavbarItem(reduceMotion)}>
          <LanguageSwitch />
          <MobileMenu items={items} open={open} onOpenChange={setOpen} />
        </motion.div>
      </motion.nav>
    </motion.div>
  );
}
