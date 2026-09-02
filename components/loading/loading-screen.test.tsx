import { act, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getLoadingOverlayAnimation, LoadingScreen } from "./loading-screen";

describe("LoadingScreen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("shows the loading mark and then gets out of the way", async () => {
    render(<LoadingScreen />);

    await act(async () => vi.advanceTimersByTimeAsync(1));
    const status = screen.getByRole("status", { name: /loading portfolio/i });
    expect(status).toBeInTheDocument();
    expect(status).toHaveTextContent("MB");

    await act(async () => vi.advanceTimersByTimeAsync(3500));
    expect(screen.queryByRole("status", { name: /loading portfolio/i })).not.toBeInTheDocument();
    expect(window.sessionStorage.getItem("portfolio-intro-complete")).toBe("true");
  });

  it("covers the first render with an opaque ink layer before any effects run", () => {
    render(<LoadingScreen />);

    expect(screen.getByRole("status", { name: /loading portfolio/i })).toHaveClass("bg-ink");
  });

  it("renders the opaque loading layer during server rendering", () => {
    expect(renderToString(<LoadingScreen />)).toContain("bg-ink");
  });

  it("releases the page with a clip transition instead of a blurred fade", () => {
    expect(getLoadingOverlayAnimation("leaving")).toEqual({
      clipPath: "inset(0 0 100% 0)",
      opacity: 1,
    });
  });

  it("does not show again when remounted in the same tab", async () => {
    const firstMount = render(<LoadingScreen />);
    await act(async () => vi.advanceTimersByTimeAsync(3500));
    firstMount.unmount();

    render(<LoadingScreen />);
    await act(async () => vi.advanceTimersByTimeAsync(3500));

    expect(screen.queryByRole("status", { name: /loading portfolio/i })).not.toBeInTheDocument();
  });

  it("skips the overlay when reduced motion is preferred", async () => {
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      matches: query.includes("prefers-reduced-motion: reduce"),
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }) as unknown as MediaQueryList);

    render(<LoadingScreen />);
    await act(async () => vi.advanceTimersByTimeAsync(3500));

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
