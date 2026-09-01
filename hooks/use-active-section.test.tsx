import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useActiveSection } from "./use-active-section";

let observerCallback: IntersectionObserverCallback | undefined;

class ControlledObserver {
  constructor(callback: IntersectionObserverCallback) {
    observerCallback = callback;
  }
  disconnect() {}
  observe() {}
  unobserve() {}
}

describe("useActiveSection", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
    observerCallback = undefined;
  });

  it("tracks the intersecting section and clears observers on unmount", () => {
    document.body.innerHTML = '<section id="about"></section><section id="projects"></section>';
    vi.stubGlobal("IntersectionObserver", ControlledObserver);
    const { result, unmount } = renderHook(() => useActiveSection(["about", "projects"]));
    const about = document.getElementById("about")!;

    act(() => {
      observerCallback?.([{ target: about, isIntersecting: true } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);
    });

    expect(result.current).toBe("about");
    unmount();
  });

  it("uses the most recently intersecting section when several enter together", () => {
    document.body.innerHTML = '<section id="about"></section><section id="projects"></section>';
    vi.stubGlobal("IntersectionObserver", ControlledObserver);
    const { result } = renderHook(() => useActiveSection(["about", "projects"]));
    const about = document.getElementById("about")!;
    const projects = document.getElementById("projects")!;

    act(() => {
      observerCallback?.(
        [
          { target: about, isIntersecting: true, boundingClientRect: { top: 0 } },
          { target: projects, isIntersecting: true, boundingClientRect: { top: 500 } },
        ] as unknown as IntersectionObserverEntry[],
        {} as IntersectionObserver,
      );
    });

    expect(result.current).toBe("projects");
  });
});
