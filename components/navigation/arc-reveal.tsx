"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "motion/react";

import { useLenisInstance } from "@/components/providers/smooth-scroll-provider";
import { getScrollAnchor } from "@/lib/scroll-anchor";
import {
  ARC_COVER_MS,
  ARC_EASE,
  ARC_HOLD_MS,
  ARC_LANDING_GAP,
  ARC_SOLID_IN_MS,
  ARC_SOLID_OUT_DELAY_MS,
  ARC_SOLID_OUT_MS,
  getArcPath,
  getSectionScrollTarget,
} from "@/lib/arc-reveal";

/**
 * Takes over a nav click. Returns whether it did — `false` means the caller
 * should let the plain anchor behave as it always has.
 */
type ArcNavigate = (href: string, label: string) => boolean;

export type ArcPhase = "idle" | "covering" | "holding" | "clearing";

const ArcRevealContext = createContext<ArcNavigate>(() => false);

/**
 * Kept as its own context rather than bundled with the navigate function.
 *
 * Anything watching the scroll has to be able to tell the reader's own gesture
 * apart from the jump this makes behind the cover — otherwise a jump down the
 * page reads as the reader scrolling down, hard and instantly.
 */
const ArcPhaseContext = createContext<ArcPhase>("idle");

/**
 * Broad, very faint pools of light over the frosted pane.
 *
 * Kept under 10% alpha and larger than the screen. The page behind is still
 * faintly legible through the blur, which is what makes the cover read as glass
 * laid over the site rather than a hole cut in it; anything stronger here and
 * the gradients stop being light on glass and become a picture of their own.
 */
const ARC_FROST = [
  "radial-gradient(80% 60% at 22% 18%, rgb(255 255 255 / 0.09), transparent 70%)",
  "radial-gradient(70% 55% at 78% 82%, rgb(255 255 255 / 0.06), transparent 68%)",
  "radial-gradient(60% 50% at 62% 30%, rgb(9 9 9 / 0.35), transparent 72%)",
].join(", ");

export function useArcReveal() {
  return useContext(ArcRevealContext);
}

export function useArcRevealPhase() {
  return useContext(ArcPhaseContext);
}

/**
 * Covers the page while the reader is moved to another section.
 *
 * The point is not the cover itself — it is that the journey is never seen.
 * Jumping between sections of one long page means racing through everything in
 * between, and on this page that stretch is a pinned handover and a snapping
 * rail, both of which look broken at speed. So the cover closes, the page moves
 * in one frame behind it, and the cover opens on the destination.
 *
 * The move is deliberately placed at the instant the screen is hidden, not when
 * the click happens: that ordering is the whole illusion.
 */
export function ArcRevealProvider({ children }: { children: ReactNode }) {
  const lenis = useLenisInstance();
  // Clip paths are referenced by id, which is global to the document.
  const clipId = `arc-cover-${useId()}`;
  const [phase, setPhase] = useState<ArcPhase>("idle");
  const [label, setLabel] = useState("");
  const pending = useRef<string | null>(null);

  /**
   * A motion value, not state. The path is rebuilt on every frame of both
   * sweeps, and routing that through React would re-render the whole tree sixty
   * times a second to change one string.
   */
  const progress = useMotionValue(0);
  const path = useTransform(progress, getArcPath);

  /**
   * How solid the cover is, on top of its frosting.
   *
   * A frosted cover is translucent by definition, so the page behind it stays
   * faintly legible — which is what makes it read as glass, and also what gives
   * the trick away: the move underneath is a single frame in which that
   * backdrop becomes somewhere else entirely. Seen through the blur it does not
   * read as travel, it reads as a jump cut.
   *
   * So the glass goes solid for the moment of the cut and softens again once it
   * is past. The destination then does not appear behind the glass; it comes
   * through it, which is movement where there was none.
   */
  const solidity = useMotionValue(0);

  const navigate = useCallback<ArcNavigate>(
    (href, nextLabel) => {
      /**
       * No Lenis means the reader asked for reduced motion, and the provider
       * builds no instance at all for them. There is then no smooth scroll to
       * hide and no appetite for a cover, so the anchor is left to do its own
       * plain, instant job.
       */
      if (!lenis) return false;
      // Already running: swallow the click rather than restart mid-sweep.
      if (phase !== "idle") return true;

      pending.current = href;
      setLabel(nextLabel);
      setPhase("covering");
      return true;
    },
    [lenis, phase],
  );

  /**
   * Moves the page to whatever was clicked.
   *
   * Called only from the far end of the covering sweep. Calling it any earlier
   * is the one way to break this component: the reader would watch the page
   * leap while the cover was still on its way up.
   */
  const moveToPending = useCallback(() => {
    if (!lenis) return;

    const href = pending.current;
    pending.current = null;
    const target = href ? document.querySelector<HTMLElement>(href) : null;
    if (!target) return;

    const anchor = getScrollAnchor(target);
    const top = getSectionScrollTarget(
      anchor.getBoundingClientRect().top,
      window.scrollY,
      ARC_LANDING_GAP,
    );

    /**
     * Moved through Lenis rather than `window.scrollTo`. Lenis keeps its own
     * record of where the page is, and a bare window scroll would be undone the
     * moment it resumes from that stale position. `force` is required because
     * it is stopped.
     */
    lenis.scrollTo(top, { immediate: true, force: true });

    // The URL should say where the reader is, but writing the hash the usual
    // way would make the browser jump to it a second time.
    window.history.replaceState(null, "", href);

    // The click was intercepted, so the anchor never moved focus. Without this
    // a keyboard reader carries on from the navbar and has to walk the whole
    // page again to reach what they just asked for.
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  }, [lenis]);

  useEffect(() => {
    if (phase !== "covering" || !lenis) return;

    // Stopped for the whole transition: a wheel or a keypress landing mid-sweep
    // would scroll the page underneath the cover and land somewhere else.
    lenis.stop();

    const control = animate(progress, 1, {
      duration: ARC_COVER_MS / 1000,
      ease: ARC_EASE,
      onComplete: () => {
        moveToPending();
        setPhase("holding");
      },
    });

    // Held off until the cover is nearly shut. Ramped from the start it would
    // simply be an opaque panel rising, and the frosting would never be seen.
    const thicken = animate(solidity, 1, {
      duration: ARC_SOLID_IN_MS / 1000,
      delay: (ARC_COVER_MS - ARC_SOLID_IN_MS) / 1000,
      ease: "easeIn",
    });

    return () => {
      control.stop();
      thicken.stop();
    };
  }, [lenis, moveToPending, phase, progress, solidity]);

  useEffect(() => {
    if (phase !== "holding") return;

    const timer = window.setTimeout(() => setPhase("clearing"), ARC_HOLD_MS);

    // A beat on solid first, so the cut is well past before anything behind the
    // glass can be made out again.
    const thin = animate(solidity, 0, {
      duration: ARC_SOLID_OUT_MS / 1000,
      delay: ARC_SOLID_OUT_DELAY_MS / 1000,
      ease: "easeOut",
    });

    return () => {
      window.clearTimeout(timer);
      thin.stop();
    };
  }, [phase, solidity]);

  useEffect(() => {
    if (phase !== "clearing") return;

    const control = animate(progress, 2, {
      duration: ARC_COVER_MS / 1000,
      ease: ARC_EASE,
      onComplete: () => {
        progress.set(0);
        solidity.set(0);
        setPhase("idle");
        lenis?.start();
      },
    });

    return () => control.stop();
  }, [lenis, phase, progress, solidity]);

  /**
   * Nothing releases the scroll if this unmounts mid-transition — Lenis would
   * stay stopped and the page would be frozen for good.
   */
  useEffect(() => () => lenis?.start(), [lenis]);

  return (
    <ArcRevealContext.Provider value={navigate}>
      <ArcPhaseContext.Provider value={phase}>{children}</ArcPhaseContext.Provider>

      {phase !== "idle" && (
        // Deliberately not `pointer-events-none`: while the screen is covered a
        // click should land on the cover and do nothing, rather than fall
        // through to whatever is hidden behind it.
        <div
          aria-hidden="true"
          className="fixed inset-0 z-[120]"
          data-phase={phase}
          data-testid="arc-reveal"
        >
          {/*
            The outline is never painted — it only defines the clip. The visible
            surface is the pane below it, because frosting comes from
            `backdrop-filter` and an SVG fill cannot carry one.
          */}
          <svg aria-hidden="true" className="absolute size-0">
            <defs>
              <clipPath clipPathUnits="objectBoundingBox" id={clipId}>
                <motion.path d={path} />
              </clipPath>
            </defs>
          </svg>

          <div
            className="absolute inset-0 bg-ink/85 backdrop-blur-2xl"
            data-testid="arc-reveal-pane"
            style={{ backgroundImage: ARC_FROST, clipPath: `url(#${clipId})` }}
          />

          {/*
            Inside the same clip, so it is bounded by the arc rather than
            flashing the corners the cover has not reached yet.
          */}
          <motion.div
            className="absolute inset-0 bg-ink"
            data-testid="arc-reveal-solid"
            style={{ clipPath: `url(#${clipId})`, opacity: solidity }}
          />

          <div className="absolute inset-0 grid place-items-center px-page">
            <AnimatePresence mode="wait">
              {phase === "holding" && (
                <motion.span
                  animate={{ opacity: 1, y: 0 }}
                  /*
                    Tighter than the family's default and deliberately not as
                    tight as it will go: past about -0.09em the letters of
                    `Contact` start meeting and the word reads as one mass.
                  */
                  className="font-display text-[clamp(2.5rem,6vw,5rem)] font-medium leading-none tracking-[-0.07em] text-paper"
                  data-testid="arc-reveal-label"
                  exit={{ opacity: 0, y: -15 }}
                  initial={{ opacity: 0, y: 15 }}
                  key={label}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </ArcRevealContext.Provider>
  );
}
