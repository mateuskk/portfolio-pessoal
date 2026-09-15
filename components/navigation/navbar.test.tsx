import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { completeIntro, startIntro } from "@/lib/intro";
import {
  getNavbarActiveTransition,
  getNavbarInteractionProps,
  getNavbarMotionState,
  Navbar,
  NAVBAR_HIDE_AFTER,
  shouldHideNavbar,
} from "./navbar";
import { getMobileMenuMotionStyle } from "./mobile-menu";

const items = [
  { label: "About", href: "#about" as const },
  { label: "Projects", href: "#projects" as const },
];

describe("Navbar", () => {
  beforeEach(() => {
    startIntro();
    completeIntro();
  });

  afterEach(() => {
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
  });

  /**
   * The bar's last slot is the language, not the mail link it used to be.
   *
   * Rendered here without the provider, so this is the control's own shape:
   * that the site actually changes language is asserted end to end, where
   * there is a page to change.
   */
  it("offers the site's languages in place of the mail link", async () => {
    const user = userEvent.setup();
    render(<Navbar items={items} initials="SN" />);

    expect(screen.queryByRole("link", { name: /let's talk/i })).not.toBeInTheDocument();

    /*
      Two of them: one in the desktop row, one beside the burger. CSS hides the
      wrong one at each width, but both are in the document here, so the test
      says which it means rather than relying on a query that would break the
      day the second was added. Which it did.
    */
    const triggers = screen.getAllByRole("button", { name: /language/i });
    expect(triggers).toHaveLength(2);
    await user.click(triggers[0]);

    const panel = await screen.findByTestId("language-panel");

    /**
     * Real radio inputs, one group. It is what makes "one of two" something a
     * screen reader can say and the arrow keys something that already works,
     * neither of which comes free from buttons wearing a role.
     */
    const options = within(panel).getAllByRole("radio");
    expect(options).toHaveLength(2);
    expect(within(panel).getByRole("radio", { name: /english/i })).toBeChecked();
    expect(within(panel).getByRole("radio", { name: /português/i })).not.toBeChecked();

    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("language-panel")).not.toBeInTheDocument();
  });

  /**
   * Choosing closes it, including choosing what is already chosen.
   *
   * A radio fires no change event when it is already the selected one, so the
   * panel sat open over the page after picking the language the site was
   * already in, which reads as the tap not having landed.
   */
  it("closes the language panel even when the choice does not change", async () => {
    const user = userEvent.setup();
    render(<Navbar items={items} initials="SN" />);

    const trigger = screen.getAllByRole("button", { name: /language/i })[0];
    await user.click(trigger);

    const panel = await screen.findByTestId("language-panel");
    const current = within(panel).getByRole("radio", { name: /english/i });
    expect(current).toBeChecked();

    await user.click(current);
    expect(screen.queryByTestId("language-panel")).not.toBeInTheDocument();
  });

  it("exposes desktop links and an accessible dismissible mobile dialog", async () => {
    const user = userEvent.setup();
    render(<Navbar items={items} initials="SN" />);

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
    render(<Navbar items={items} initials="SN" />);
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
    expect(getNavbarInteractionProps(false, false)).toEqual({ "aria-hidden": true, inert: true });
    expect(getNavbarInteractionProps(false, true)).toEqual({});
  });

  it("draws the monogram rather than setting the initials as text", () => {
    render(<Navbar items={items} initials="SN" />);

    // The mark is a letterform, not type: a brush script at this size has to be
    // the drawn outline, and no font is loaded for it.
    const monogram = screen.getByTestId("navbar-monogram");
    expect(monogram.tagName.toLowerCase()).toBe("svg");
    expect(monogram.querySelector("path")).toHaveAttribute("fill", "currentColor");
    expect(screen.getByRole("link", { name: /back to top/i })).toContainElement(monogram);
  });

  it("gets out of the way going down, and comes back on any move up", () => {
    const past = NAVBAR_HIDE_AFTER + 200;

    // Direction is the rule, so the same position hides or shows depending
    // only on where the page was a moment ago.
    expect(shouldHideNavbar(past, past + 80)).toBe(true);
    expect(shouldHideNavbar(past, past - 80)).toBe(false);
    expect(shouldHideNavbar(past, past)).toBe(false);
  });

  it("stays put near the top of the page", () => {
    // Downward, but with nothing behind the bar worth reading yet. Hiding here
    // would make the first scroll of a visit flicker it away and back.
    expect(shouldHideNavbar(0, NAVBAR_HIDE_AFTER - 10)).toBe(false);
    expect(shouldHideNavbar(NAVBAR_HIDE_AFTER - 20, NAVBAR_HIDE_AFTER)).toBe(false);
    expect(shouldHideNavbar(NAVBAR_HIDE_AFTER, NAVBAR_HIDE_AFTER + 1)).toBe(true);
  });

  it("reacts when reduced motion changes while the navbar is mounted", () => {
    let reduced = false;
    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      get matches() { return query.includes("prefers-reduced-motion: reduce") && reduced; },
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
      removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
    }) as unknown as MediaQueryList);

    render(<Navbar items={items} initials="SN" />);
    expect(screen.getByRole("navigation", { name: /primary/i })).toHaveAttribute("data-reduced-motion", "false");

    act(() => {
      reduced = true;
      listeners.forEach((listener) => listener({ matches: true } as MediaQueryListEvent));
    });

    expect(screen.getByRole("navigation", { name: /primary/i })).toHaveAttribute("data-reduced-motion", "true");
  });
});
