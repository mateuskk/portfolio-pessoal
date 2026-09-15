'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import { useScroll, useTransform, type MotionValue } from 'motion/react';
import Snap from 'lenis/snap';

import { useLenisInstance } from '@/components/providers/smooth-scroll-provider';
import { progressToProjectIndex } from '@/components/projects/project-diagonal';

/**
 * `lock` is what makes one gesture turn one whole page, which is the behaviour
 * of the reference: measured there, a 100px wheel tick and a 600px shove both
 * advance exactly one 900px section. In the library's own terms, `lock` aims at
 * the *next* snap point in the direction of travel whatever the delta is, and
 * ignores further input while a snap is running — rather than `proximity`,
 * which lets the page scroll freely and only settles on the nearest point once
 * it stops.
 *
 * The threshold has to be a whole viewport because of that. `lock` still only
 * fires when the target is within `distanceThreshold`, and consecutive panels
 * are exactly one screen apart, so anything smaller would never reach the next
 * panel and the lock would never engage at all.
 *
 * One viewport is also what keeps it off the rest of the page: from anywhere
 * further than one screen above the first panel the target is out of range, so
 * the hero, the about lock and the stack lock are untouched. Past the last
 * panel there is no next point, so scrolling out to the contact section is
 * free.
 */
export const PROJECT_SNAP_THRESHOLD = '100%';

/**
 * Sampled frame by frame off the reference rather than guessed. One wheel notch
 * there carries a 900px section over 1166–1183ms across repeated runs; this
 * lands at 1164–1166ms, inside its own spread.
 *
 * The first measurement taken said 917ms and was a warm-up outlier — worth
 * knowing before anyone re-measures once and "corrects" this.
 */
export const PROJECT_SNAP_DURATION = 1.1;

/**
 * The reference covers half the distance at 47.6% of the way through, which is
 * a symmetric ease-in-out — not the ease-out family the rest of this site uses.
 *
 * Sine rather than cubic or quad because those measured back-loaded here
 * (cubic 0.563, quad 0.526). The remaining gap to 0.476 is not the curve: Lenis
 * free-scrolls the first wheel notch before the lock takes it over, ~15px of
 * pre-roll the reference has no equivalent for. Discounting it this reaches
 * halfway at 0.49, so the shape does match — swapping the easing again will not
 * close the last of it.
 */
export function easeInOutSine(progress: number) {
  return -(Math.cos(Math.PI * progress) - 1) / 2;
}

/**
 * Only governs input this hook does not intercept itself. Wheel is driven
 * directly — see `wheelToSnap` — so nothing on the desktop stage waits on it.
 */
export const PROJECT_SNAP_DEBOUNCE = 85;

/**
 * A short landing beat when a strong gesture carries the reader out of Stack.
 * It is intentionally much shorter than a project-to-project turn: enough to
 * establish project one as the destination, without making the section feel
 * sticky or changing the inertia that leads into it.
 */
export const PROJECT_ARRIVAL_DURATION = 0.46;

function easeOutQuart(progress: number) {
  return 1 - Math.pow(1 - progress, 4);
}

/**
 * Mirrors the `hidden lg:block` on the stage. Below it the markers are
 * `display: none`, which makes every rectangle collapse to zero — and a snap
 * registered on those would sit at the top of the document and yank a reader
 * browsing the hero in a narrow window.
 */
/** Matches the scene's own test: the snap belongs to the pinned desktop stage. */
const DESKTOP_QUERY = '(min-width: 1024px) and (pointer: fine)';

/**
 * The share of the rail spent arriving, before the first project is on show.
 *
 * The stack does not scroll away upwards; it is held and slid off to the side,
 * and this section comes in from the other side to meet it. That crossing needs
 * scroll of its own, and it has to be scroll in which nothing turns — arriving
 * already on the second project would make the whole handover read as a skip.
 *
 * A fraction rather than a length so it stays tied to the rail: the two are
 * declared together in `projects-section`, and a lead that did not track the
 * rail's height would silently start the stage part-turned.
 */
export const PROJECT_LEAD = 0.2;

function clamp(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

type SharedProjectScene = {
  arrival: MotionValue<number>;
  enabled: boolean;
  markersRef: RefObject<HTMLDivElement | null>;
  railRef: RefObject<HTMLDivElement | null>;
  scrollYProgress: MotionValue<number>;
};

export function useProjectSnap(
  count: number,
  sharedScene?: SharedProjectScene,
) {
  const lenis = useLenisInstance();
  const ownedRailRef = useRef<HTMLDivElement>(null);
  const ownedMarkersRef = useRef<HTMLDivElement>(null);
  const railRef = sharedScene?.railRef ?? ownedRailRef;
  const markersRef = sharedScene?.markersRef ?? ownedMarkersRef;
  const [onDesktop, setOnDesktop] = useState(false);

  /**
   * Handed out as a motion value, not as state. Every slab and both text rails
   * are driven off this at frame rate; routing it through React would re-render
   * the whole stage on every scroll event to change a handful of transforms.
   *
   * Read from the scroll position rather than the snap's callbacks, too: the
   * snap only fires for wheel and touch, so a reader arriving by keyboard or by
   * dragging the scrollbar would leave the stage frozen on the first project.
   */
  const { scrollYProgress: railProgress } = useScroll({
    target: sharedScene && !sharedScene.enabled ? undefined : railRef,
    offset: ['start start', 'end end'],
  });

  /**
   * Two readings of the same rail: one for the crossing, one for the projects.
   *
   * Written as functions rather than `useTransform(value, [in], [out])` — the
   * range form lets Motion promote a scroll-derived value onto a hardware
   * animation, a path that has already mishandled a pinned section here.
   */
  const ownedArrival = useTransform(() =>
    clamp(railProgress.get() / PROJECT_LEAD),
  );
  const ownedProjectProgress = useTransform(() =>
    clamp((railProgress.get() - PROJECT_LEAD) / (1 - PROJECT_LEAD)),
  );
  const arrival = sharedScene?.arrival ?? ownedArrival;
  const scrollYProgress = sharedScene?.scrollYProgress ?? ownedProjectProgress;

  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY);
    const sync = () => setOnDesktop(query.matches);

    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const container = markersRef.current;
    // `lenis` is null under reduced motion, where no instance is created at
    // all. No snapping is the right behaviour there, so there is nothing to
    // branch on.
    if (!lenis || !container || !onDesktop) return;

    // The markers are this element's children, so they need no refs of their
    // own — and the snap gets them in document order for free.
    const stops = Array.from(container.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement,
    );
    if (stops.length === 0) return;

    let snapping = false;
    let unlockTimer = 0;
    let arrivalHolding = false;
    let arrivalTimer = 0;
    let projectsOwned = false;
    let previousTop = container.getBoundingClientRect().top;

    const unlock = () => {
      snapping = false;
      window.clearTimeout(unlockTimer);
    };

    const snap = new Snap(lenis, {
      type: 'lock',
      debounce: PROJECT_SNAP_DEBOUNCE,
      distanceThreshold: PROJECT_SNAP_THRESHOLD,
      duration: PROJECT_SNAP_DURATION,
      easing: easeInOutSine,
      onSnapStart: () => {
        snapping = true;
        // A dead man's switch. If the completion callback is ever missed the
        // page would be left unscrollable, which is far worse than a lurch.
        window.clearTimeout(unlockTimer);
        unlockTimer = window.setTimeout(
          unlock,
          PROJECT_SNAP_DURATION * 1000 + 400,
        );
      },
      onSnapComplete: unlock,
    });

    /**
     * A nearby snap point must not pull the reader out of the stack, nor out of
     * the crossing that carries this section in past it.
     *
     * Measured on the markers rather than on the rail, because the rail now
     * begins a screen earlier than the first project does. Gated on the rail, a
     * single notch halfway through the crossing aimed at the *second* project
     * and took 1487px in one gesture — over the handover and past project one.
     */
    snap.stop();

    const releaseArrival = () => {
      arrivalHolding = false;
      window.clearTimeout(arrivalTimer);
      snap.start();
    };

    const holdArrivalOnFirstProject = () => {
      const first = stops[0];
      if (!first) return;

      arrivalHolding = true;
      snap.stop();
      window.clearTimeout(arrivalTimer);

      // Cancel the remaining Lenis target from the gesture that began in the
      // Stack and settle on the first marker. Without this takeover, the same
      // target can coast one or two screens into Projects before the snap owns
      // the viewport. Keeping this local to the ownership boundary preserves
      // the Stack's existing free-scroll inertia.
      const firstTop = window.scrollY + first.getBoundingClientRect().top;
      lenis.scrollTo(firstTop, {
        duration: PROJECT_ARRIVAL_DURATION,
        easing: easeOutQuart,
        force: true,
        lock: true,
        userData: { initiator: 'project-arrival' },
        onComplete: releaseArrival,
      });

      // The snap library debounces the wheel event that caused the crossing.
      // Starting it only after this short hold also lets that queued callback
      // expire while snapping is stopped, so it cannot reinterpret the
      // arrival as a request for project two.
      arrivalTimer = window.setTimeout(
        releaseArrival,
        PROJECT_ARRIVAL_DURATION * 1000 + 250,
      );
    };

    const syncSnapActivation = () => {
      const bounds = container.getBoundingClientRect();
      const projectsOwnViewport =
        bounds.top <= 1 && bounds.bottom >= window.innerHeight - 1;

      const arrivedAtFirstProject =
        !projectsOwned &&
        projectsOwnViewport &&
        previousTop > 1 &&
        bounds.top > -window.innerHeight * 0.25;

      projectsOwned = projectsOwnViewport;
      previousTop = bounds.top;

      if (arrivedAtFirstProject) holdArrivalOnFirstProject();
      else if (projectsOwnViewport && !arrivalHolding) snap.start();
      else if (!projectsOwnViewport) snap.stop();
    };

    // `ignoreSticky` because the stack panel above this section is pinned with
    // `position: sticky`, and the snap measures rectangles.
    const remove = snap.addElements(stops, {
      align: ['start'],
      ignoreSticky: true,
    });
    syncSnapActivation();
    window.addEventListener('scroll', syncSnapActivation, { passive: true });
    window.addEventListener('resize', syncSnapActivation);

    /**
     * The wheel drives the snap directly, and Lenis is never allowed to move
     * the page from it while the stage is on screen.
     *
     * Letting it through first was the bug. Lenis would scroll the notch and
     * ease itself to a halt, and 85ms later the snap would start again from
     * zero — measured, the page ran at 10px a frame, fell to 1px for two
     * frames, then climbed back. That stall is what reads as the animation
     * catching and restarting, and no amount of retiming closes it: the snap
     * always begins at rest, so any pre-roll leaves a seam. Removing the
     * pre-roll removes the seam.
     */
    const blocked = (event: WheelEvent) => {
      event.preventDefault();
      event.stopImmediatePropagation();
    };

    const wheelToSnap = (event: WheelEvent) => {
      if (snapping || arrivalHolding) {
        blocked(event);
        return;
      }

      // Only while the projects themselves hold the screen. Before them is the
      // crossing from the stack, which stays ordinary scroll so that it plays
      // out under the reader's own hand; after them the page has to carry on,
      // or the section becomes a trap.
      const bounds = container.getBoundingClientRect();
      if (bounds.top > 1 || bounds.bottom < window.innerHeight - 1) return;

      const current = progressToProjectIndex(scrollYProgress.get(), count);
      const target = current + (event.deltaY > 0 ? 1 : -1);
      // Off either end, the reader is leaving. Let them.
      if (target < 0 || target > count - 1) return;

      blocked(event);
      snap.goTo(target);
    };

    window.addEventListener('wheel', wheelToSnap, {
      capture: true,
      passive: false,
    });

    return () => {
      unlock();
      window.clearTimeout(arrivalTimer);
      window.removeEventListener('wheel', wheelToSnap, { capture: true });
      window.removeEventListener('scroll', syncSnapActivation);
      window.removeEventListener('resize', syncSnapActivation);
      remove();
      snap.destroy();
    };
  }, [lenis, count, markersRef, onDesktop, scrollYProgress]);

  return { railRef, markersRef, scrollYProgress, arrival };
}
