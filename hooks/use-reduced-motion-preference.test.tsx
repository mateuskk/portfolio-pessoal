import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useReducedMotionPreference } from "./use-reduced-motion-preference";

describe("useReducedMotionPreference", () => {
  afterEach(() => vi.restoreAllMocks());

  it("uses an initially reduced preference on the first render", () => {
    const renders: boolean[] = [];
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    } as unknown as MediaQueryList);

    renderHook(() => {
      const preference = useReducedMotionPreference();
      renders.push(preference);
      return preference;
    });

    expect(renders[0]).toBe(true);
  });

  it("reacts when the system motion preference changes and cleans up", () => {
    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    const preference = {
      matches: false,
      media: "(prefers-reduced-motion: reduce)",
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
      removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
    } as unknown as MediaQueryList;
    vi.spyOn(window, "matchMedia").mockReturnValue(preference);

    const { result, unmount } = renderHook(() => useReducedMotionPreference());
    expect(result.current).toBe(false);

    Object.defineProperty(preference, "matches", { configurable: true, value: true });
    act(() => listeners.forEach((listener) => listener({ matches: true } as MediaQueryListEvent)));
    expect(result.current).toBe(true);

    unmount();
    expect(listeners.size).toBe(0);
  });
});
