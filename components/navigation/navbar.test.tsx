import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getNavbarActiveTransition, getNavbarMotionState, Navbar } from "./navbar";
import { getMobileMenuMotionStyle } from "./mobile-menu";

const items = [
  { label: "About", href: "#about" as const },
  { label: "Projects", href: "#projects" as const },
];

describe("Navbar", () => {
  afterEach(() => {
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
  });

  it("exposes desktop links and an accessible dismissible mobile dialog", async () => {
    const user = userEvent.setup();
    render(<Navbar items={items} initials="SN" email="hello@example.com" />);

    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "#about");
    expect(screen.getAllByTestId("nav-link-underline")).toHaveLength(items.length);
    const menuButton = screen.getByRole("button", { name: /open menu/i });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    const dialog = screen.getByRole("dialog", { name: /navigation/i });
    expect(dialog).toHaveClass("inset-x-0", "top-[4.75rem]", "rounded-none");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: /navigation/i })).not.toBeInTheDocument();
  });

  it("contracts after the page starts scrolling", () => {
    render(<Navbar items={items} initials="SN" email="hello@example.com" />);
    Object.defineProperty(window, "scrollY", { configurable: true, value: 80 });

    fireEvent.scroll(window);

    expect(screen.getByRole("navigation")).toHaveAttribute("data-compact", "true");
  });

  it("makes the mobile panel transition immediate for reduced motion", () => {
    expect(getMobileMenuMotionStyle(true)).toEqual({
      clipPath: "none",
      transitionDuration: "0ms",
    });
  });

  it("holds the signature entrance until the intro finishes and removes motion when requested", () => {
    expect(getNavbarMotionState(false, false)).toEqual({ initial: false, animate: "hidden" });
    expect(getNavbarMotionState(false, true)).toEqual({ initial: false, animate: "visible" });
    expect(getNavbarMotionState(true, false)).toEqual({ initial: false, animate: "visible" });
    expect(getNavbarActiveTransition(true)).toEqual({ duration: 0 });
  });

  it("reacts when reduced motion changes while the navbar is mounted", () => {
    let reduced = false;
    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    window.sessionStorage.setItem("portfolio-intro-complete", "true");
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      get matches() { return query.includes("prefers-reduced-motion: reduce") && reduced; },
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
      removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
    }) as unknown as MediaQueryList);

    render(<Navbar items={items} initials="SN" email="hello@example.com" />);
    expect(screen.getByRole("navigation", { name: /primary/i })).toHaveAttribute("data-reduced-motion", "false");

    act(() => {
      reduced = true;
      listeners.forEach((listener) => listener({ matches: true } as MediaQueryListEvent));
    });

    expect(screen.getByRole("navigation", { name: /primary/i })).toHaveAttribute("data-reduced-motion", "true");
  });
});
