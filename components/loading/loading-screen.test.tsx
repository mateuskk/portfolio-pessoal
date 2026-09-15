import { act, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { startIntro } from "@/lib/intro";
import { getPenTiming, getVeilMask, LoadingScreen } from "./loading-screen";

/**
 * Runs the intro to its end.
 *
 * Two steps, not one, and that is forced by how the gate works rather than by
 * taste: the wait for a steady frame ends inside a timer, and React only re-runs
 * the effect that starts the stage clock once act() settles. Advanced in a
 * single call, those stage timers get scheduled after the clock has already run
 * past them, and the intro never finishes.
 */
async function runIntro() {
  await act(async () => vi.advanceTimersByTimeAsync(2000));
  await act(async () => vi.advanceTimersByTimeAsync(4000));
}

describe("LoadingScreen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    startIntro();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("shows the ring and the mark, then gets out of the way", async () => {
    render(<LoadingScreen />);

    await act(async () => vi.advanceTimersByTimeAsync(1));
    const status = screen.getByRole("status", { name: /loading portfolio/i });
    expect(status).toBeInTheDocument();
    expect(status).toHaveTextContent("MB");
    expect(screen.getByTestId("loading-ring")).toBeInTheDocument();

    await runIntro();
    expect(screen.queryByRole("status", { name: /loading portfolio/i })).not.toBeInTheDocument();
  });

  it("covers the first render with the veil before any effects run", () => {
    render(<LoadingScreen />);

    expect(screen.getByTestId("loading-veil")).toHaveClass("bg-paper/90");
  });

  it("renders the opaque loading layer during server rendering", () => {
    expect(renderToString(<LoadingScreen />)).toContain("bg-paper/90");
  });

  it("holds the sequence until the page can actually render a frame", async () => {
    // A main thread too busy to serve a frame — which is exactly the state the
    // page is in while it hydrates and starts its canvas.
    vi.spyOn(window, "requestAnimationFrame").mockReturnValue(1);

    render(<LoadingScreen />);
    // Past the point the whole intro would have finished, had its clock been
    // started at mount. Nothing may have been spent yet.
    await act(async () => vi.advanceTimersByTimeAsync(3400));

    expect(
      screen.getByRole("status", { name: /loading portfolio/i }),
    ).toBeInTheDocument();
  });

  it("plays anyway when the frames never settle", async () => {
    // No frame ever arrives. The intro must still end: a veil that waits on a
    // signal that cannot come is a permanently blank site.
    vi.spyOn(window, "requestAnimationFrame").mockReturnValue(1);

    render(<LoadingScreen />);
    await runIntro();

    expect(
      screen.queryByRole("status", { name: /loading portfolio/i }),
    ).not.toBeInTheDocument();
  });

  it("writes every stroke at one pen speed", () => {
    // Three strokes of very different lengths. Split the time evenly between
    // them instead and the hand visibly races through the long M and crawls
    // over the short stem.
    const lengths = [600, 100, 300];
    const timing = getPenTiming(lengths, { leadMs: 0, overlapMs: 0, writeMs: 1000 });

    const speeds = timing.map((stroke, index) => lengths[index] / stroke.duration);
    for (const speed of speeds) {
      expect(speed).toBeCloseTo(speeds[0], 6);
    }
  });

  it("finishes the writing when it says it will, overlaps and all", () => {
    const timing = getPenTiming([526, 131, 395], {
      leadMs: 300,
      overlapMs: 110,
      writeMs: 2000,
    });
    const last = timing[timing.length - 1];

    // Pen down after the lead, up exactly writeMs later. Overlapping steals
    // time from the span, so this only holds if it is compensated for.
    expect(timing[0].delay).toBeCloseTo(0.3, 6);
    expect(last.delay + last.duration).toBeCloseTo(2.3, 6);
  });

  it("starts each stroke before the one before it has finished", () => {
    const timing = getPenTiming([526, 131, 395], {
      leadMs: 0,
      overlapMs: 110,
      writeMs: 2000,
    });

    for (let index = 1; index < timing.length; index += 1) {
      const previousEnd = timing[index - 1].delay + timing[index - 1].duration;
      expect(timing[index].delay).toBeLessThan(previousEnd);
      expect(timing[index].delay).toBeCloseTo(previousEnd - 0.11, 6);
    }
  });

  it("opens the veil as a hard-edged circle, not a soft one", () => {
    // Both stops share a position, which is what makes the edge a circle rather
    // than a gradient; and the percentage is read against the distance to the
    // farthest corner, so 100 is exactly where the hole clears the screen.
    expect(getVeilMask(0)).toContain("transparent 0%, black 0%");
    expect(getVeilMask(100)).toContain("transparent 100%, black 100%");
    expect(getVeilMask(40)).toContain("circle at 50% 50%");
  });

  it("keeps the MB independent from the disc while the site is revealed", async () => {
    render(<LoadingScreen />);

    // Let the steady-frame fallback release the animation clock, then reach
    // the exact moment the completed ring starts opening the page.
    await act(async () => vi.advanceTimersByTimeAsync(2000));
    await act(async () => vi.advanceTimersByTimeAsync(2400));

    const disc = screen.getByTestId("loading-disc");
    const mark = screen.getByTestId("loading-mb");

    expect(screen.getByRole("status", { name: /loading portfolio/i })).toBeInTheDocument();
    expect(disc).not.toContainElement(mark);
    expect(mark).toBeInTheDocument();
  });

  it("keeps the MB legible when the transparent disc reveals the dark hero", () => {
    render(<LoadingScreen />);

    expect(screen.getByTestId("loading-mb")).toHaveClass(
      "mix-blend-difference",
      "text-white",
    );
  });

  it("starts a new sequence when the page root mounts again", async () => {
    const firstMount = render(<LoadingScreen />);
    await runIntro();
    firstMount.unmount();

    render(<LoadingScreen />);
    expect(screen.getByRole("status", { name: /loading portfolio/i })).toBeInTheDocument();
    await runIntro();

    expect(screen.queryByRole("status", { name: /loading portfolio/i })).not.toBeInTheDocument();
  });

  it("runs a fresh loading sequence after a full page reload", async () => {
    window.sessionStorage.setItem("portfolio-intro-complete", "true");

    render(<LoadingScreen />);

    expect(screen.getByRole("status", { name: /loading portfolio/i })).toBeInTheDocument();

    await runIntro();
    expect(screen.queryByRole("status", { name: /loading portfolio/i })).not.toBeInTheDocument();
  });

  it("skips the overlay when reduced motion is preferred", async () => {
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      matches: query.includes("prefers-reduced-motion: reduce"),
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }) as unknown as MediaQueryList);

    render(<LoadingScreen />);
    await runIntro();

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
