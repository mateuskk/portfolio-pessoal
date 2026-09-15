"use client";

import { useEffect, useState } from "react";

import { getScrollAnchor } from "@/lib/scroll-anchor";

type Region = { id: string; element: HTMLElement };

export function useActiveSection(ids: string[]) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const idKey = ids.join("|");

  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;

    const wanted = idKey.split("|").filter(Boolean);
    if (wanted.length === 0) return;

    /**
     * Each section is watched through the element that holds its place in the
     * page, which for a pinned section is its rail rather than the section
     * itself. Watching the section directly lit the about for the whole stack
     * handover: pinned, it never leaves the middle of the screen.
     */
    const resolve = (): Region[] =>
      wanted
        .map((id) => ({ id, section: document.getElementById(id) }))
        .filter((entry): entry is { id: string; section: HTMLElement } => Boolean(entry.section))
        .map((entry) => ({ id: entry.id, element: getScrollAnchor(entry.section) }));

    let regions: Region[] = [];
    let idByElement = new Map<Element, string>();
    const inBand = new Set<string>();

    /**
     * The later section wins wherever two overlap, because on this page that is
     * literally what is happening: the stack is pulled up over the pinned about
     * and covers it, so for the length of that overlap the stack is what the
     * reader can see.
     *
     * Taken from the full set every time rather than from the entries just
     * delivered — a callback only carries what changed, and deciding from that
     * alone made the answer depend on which element happened to cross a
     * boundary first.
     */
    const current = () => {
      for (let index = regions.length - 1; index >= 0; index -= 1) {
        if (inBand.has(regions[index].id)) return regions[index].id;
      }
      return null;
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = idByElement.get(entry.target);
          if (!id) continue;
          if (entry.isIntersecting) inBand.add(id);
          else inBand.delete(id);
        }

        const next = current();
        // Nothing in the band is usually a momentary gap between two sections;
        // clearing there would blink the selection off and straight back on.
        if (next !== null) setActiveSection(next);
      },
      { rootMargin: "-35% 0px -55%", threshold: [0, 0.25, 0.6] },
    );

    /**
     * Points the observer at whatever currently answers to each id.
     *
     * An id is not a stable handle to an element here. The stack and the
     * projects share one scene that lays them out one way below `lg` and
     * another above it, and switching between those replaces the elements
     * carrying `#stack` and `#projects` rather than restyling them. Measured on
     * load, the first pair mounts at 124ms and is thrown away at 654ms; the
     * same swap happens again on every resize across the breakpoint.
     *
     * Resolved once and kept, the observer was left holding the discarded pair.
     * Detached elements never intersect anything, so those two sections could
     * never enter the band and the selection had only the about and the contact
     * left to choose between — which is exactly where it sat, for the whole
     * length of the stack and the projects.
     */
    const attach = () => {
      const next = resolve();
      if (next.length === 0) return;

      const unchanged =
        next.length === regions.length &&
        next.every((region, index) => region.element === regions[index].element);
      if (unchanged) return;

      observer.disconnect();
      // The entries for the old elements are never coming, so anything left
      // here would be a section the reader cannot possibly be looking at.
      inBand.clear();
      regions = next;
      idByElement = new Map(regions.map((region) => [region.element, region.id]));
      for (const region of regions) observer.observe(region.element);
    };

    /**
     * Cheap because it almost always decides nothing: the comparison above
     * exits on identity, and a burst of DOM changes is collapsed into a single
     * check on the next frame.
     */
    let queued = 0;
    const recheck = () => {
      if (queued) return;
      queued = window.requestAnimationFrame(() => {
        queued = 0;
        attach();
      });
    };

    // Guarded for the test environment, which has no such thing — an
    // unguarded observer here threw before and took the whole page shell down.
    const swaps = typeof MutationObserver === "undefined" ? null : new MutationObserver(recheck);
    swaps?.observe(document.body, { childList: true, subtree: true });

    /**
     * Above the first section nothing is selected, and that cannot come from
     * the observer.
     *
     * It reports the crossing, not the resting place: the first section leaves
     * the band while its top is still partway up the screen, and scrolling on
     * to the top of the page produces no further entries. Asked at that
     * crossing whether the reader had reached the hero, the answer was no — and
     * then it was never asked again.
     */
    const clearAboveFirstRegion = () => {
      const first = regions[0];
      if (first && first.element.getBoundingClientRect().top > window.innerHeight) {
        setActiveSection(null);
      }
    };

    attach();
    clearAboveFirstRegion();
    window.addEventListener("scroll", clearAboveFirstRegion, { passive: true });

    return () => {
      observer.disconnect();
      swaps?.disconnect();
      if (queued) window.cancelAnimationFrame(queued);
      window.removeEventListener("scroll", clearAboveFirstRegion);
    };
  }, [idKey]);

  return activeSection;
}
