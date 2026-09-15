"use client";

import { useSyncExternalStore } from "react";

/**
 * Whether this is a handheld: a phone or a tablet, in either orientation.
 *
 * The question used to be about size and it kept being the wrong one. First a
 * `max-width: 768px` test, which a phone cleared the moment it was turned
 * sideways. Then a size test with an orientation clause, which a tablet cleared
 * simply by being a tablet: an iPad Pro reports 1032x1376 and was handed the
 * full desktop layout, where a WebGL canvas sized for a wide screen landed on
 * top of the title.
 *
 * So it asks about the device instead. `pointer: coarse` is true when the
 * primary input is a finger, which is exactly the set of machines this site
 * should hand the simpler, cheaper layout to, and it does not care how the
 * thing is held or how many pixels it has. A desktop reports `fine` even with a
 * touchscreen attached, because its primary pointer is still the mouse.
 */
const HANDHELD_QUERY = "(pointer: coarse)";

/**
 * The list is made once and kept.
 *
 * `getSnapshot` is read by React on every render of every component using this,
 * and more than once per render to check for tearing, so building a fresh
 * `MediaQueryList` inside it meant allocating one several times a frame across
 * four components.
 */
let query: MediaQueryList | null = null;

function getQuery() {
  query ??= window.matchMedia(HANDHELD_QUERY);
  return query;
}

function subscribe(onChange: () => void) {
  const list = getQuery();
  list.addEventListener("change", onChange);
  return () => list.removeEventListener("change", onChange);
}

function getSnapshot() {
  return getQuery().matches;
}

/** The server has no input device to ask about, and renders the desktop tree. */
function getServerSnapshot() {
  return false;
}

export function useIsHandheld() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
