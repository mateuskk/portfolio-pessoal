import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LoadingScreen } from "./loading-screen";

describe("LoadingScreen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("shows a bounded first-tab counter and then gets out of the way", async () => {
    render(<LoadingScreen />);

    await act(async () => vi.advanceTimersByTimeAsync(1));
    expect(screen.getByRole("status", { name: /loading portfolio/i })).toHaveTextContent(/\d{1,3}/);
    expect(screen.getByRole("status", { name: /loading portfolio/i })).toHaveClass("pointer-events-none");

    await act(async () => vi.advanceTimersByTimeAsync(899));
    expect(screen.getByRole("status", { name: /loading portfolio/i })).toHaveTextContent("100");

    await act(async () => vi.advanceTimersByTimeAsync(200));
    expect(screen.queryByRole("status", { name: /loading portfolio/i })).not.toBeInTheDocument();
    expect(window.sessionStorage.getItem("portfolio-intro-complete")).toBe("true");
  });

  it("does not show again when remounted in the same tab", async () => {
    const firstMount = render(<LoadingScreen />);
    await act(async () => vi.advanceTimersByTimeAsync(1100));
    firstMount.unmount();

    render(<LoadingScreen />);
    await act(async () => vi.advanceTimersByTimeAsync(1100));

    expect(screen.queryByRole("status", { name: /loading portfolio/i })).not.toBeInTheDocument();
  });

  it("skips the overlay when reduced motion is preferred", async () => {
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      matches: query.includes("prefers-reduced-motion: reduce"),
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }) as unknown as MediaQueryList);

    render(<LoadingScreen />);
    await act(async () => vi.advanceTimersByTimeAsync(1200));

    expect(screen.queryByRole("status", { name: /loading portfolio/i })).not.toBeInTheDocument();
  });

  it("never reappears after reduced motion is enabled during the intro", async () => {
    let reduced = false;
    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      get matches() { return query.includes("prefers-reduced-motion: reduce") && reduced; },
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
      removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
    }) as unknown as MediaQueryList);

    render(<LoadingScreen />);
    await act(async () => vi.advanceTimersByTimeAsync(1));
    expect(screen.getByRole("status", { name: /loading portfolio/i })).toBeInTheDocument();

    act(() => {
      reduced = true;
      listeners.forEach((listener) => listener({ matches: true } as MediaQueryListEvent));
    });
    expect(screen.queryByRole("status", { name: /loading portfolio/i })).not.toBeInTheDocument();

    act(() => {
      reduced = false;
      listeners.forEach((listener) => listener({ matches: false } as MediaQueryListEvent));
    });
    expect(screen.queryByRole("status", { name: /loading portfolio/i })).not.toBeInTheDocument();
  });
});
