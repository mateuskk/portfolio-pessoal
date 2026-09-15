/**
 * The element whose position actually says where a section lives.
 *
 * A section held in a pinned frame sits under `position: sticky`, and both its
 * rect and its `offsetTop` then report where it is *stuck* rather than where it
 * belongs. That has now caused the same class of bug twice, in two unrelated
 * places, which is why it lives here rather than in either of them:
 *
 *  - navigating back to the about did nothing, because asked from further down
 *    the page it answered "right about here" and the target came out 17px from
 *    where the reader already was;
 *  - the navbar lit the about while the reader was looking at the stack,
 *    because a pinned about sits inside the "you are here" band for the whole
 *    length of its rail.
 *
 * The rail holding that frame is a plain block and never moves, so it is what
 * gets measured. Sections that are not pinned answer for themselves.
 */
export const SCROLL_ANCHOR_ATTRIBUTE = "data-scroll-anchor";

export function getScrollAnchor(target: HTMLElement): HTMLElement {
  /**
   * A section that knows its own box is misleading says so, and that answer
   * wins. The projects are the case: the section is lifted a little over two
   * screens so that it sits beside the stack instead of below it, which puts
   * its top in the middle of the stack's lock. Measured from the box, the
   * navbar read "projects" from before the stack had even locked, and clicking
   * projects landed on the stack with all four projects still off to the right.
   *
   * A region, not a point, because the two callers want different things from
   * it — where to land, and how much of the page this section accounts for.
   *
   * A direct child, and only a direct child. Searched at any depth, a container
   * inherits the answer of whatever it happens to wrap: `<main>` holds the
   * whole page, so asking it for the top of the document returned the projects'
   * anchor instead, and the monogram's way home landed a thousand pixels inside
   * the projects. An anchor speaks for the element it hangs from, nothing
   * above it.
   */
  const declared = target.querySelector<HTMLElement>(
    `:scope > [${SCROLL_ANCHOR_ATTRIBUTE}]`,
  );
  if (declared) return declared;

  let node: HTMLElement | null = target;

  while (node && node !== document.body) {
    if (getComputedStyle(node).position === "sticky") {
      return node.parentElement ?? node;
    }
    node = node.parentElement;
  }

  return target;
}
