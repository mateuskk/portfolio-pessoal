import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { socialNetworks } from "@/lib/social-catalog";
import { CAROUSEL_SPEED, getCarouselPosition } from "./contact-carousel";
import { ContactSection } from "./contact-section";

describe("getCarouselPosition", () => {
  it("travels left at the measured pace", () => {
    // One second of travel is one second's worth of the rail, and no more.
    expect(getCarouselPosition(0, 1000)).toBeCloseTo(-CAROUSEL_SPEED, 5);
    expect(getCarouselPosition(-10, 500)).toBeCloseTo(-10 - CAROUSEL_SPEED / 2, 5);
  });

  /**
   * The seam is the whole difficulty. The rail carries two identical copies, so
   * -50% is the exact point where the second copy stands where the first did:
   * resetting to 0 there is invisible, and resetting anywhere else is a jump.
   */
  it("wraps a whole copy at a time, carrying the remainder across", () => {
    expect(getCarouselPosition(-49.9, 1000)).toBeCloseTo(-49.9 + 50 - CAROUSEL_SPEED, 5);
    // Not snapped to zero: the overshoot has to survive the wrap, or the rail
    // loses a sliver of travel on every lap and drifts out of step.
    expect(getCarouselPosition(-50, 0)).toBe(0);
  });

  it("stays inside one copy's worth of travel, however long it runs", () => {
    let position = 0;
    for (let frame = 0; frame < 5000; frame += 1) {
      position = getCarouselPosition(position, 16.7);
      expect(position).toBeLessThanOrEqual(0);
      expect(position).toBeGreaterThan(-50);
    }
  });
});

describe("ContactSection", () => {
  it("exposes direct contact and social destinations", () => {
    render(
      <ContactSection
        contact={{
          email: "hello@example.com",
          linkedin: "https://linkedin.com/in/example",
          github: "https://github.com/example",
        }}
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: /have a project in mind.*make it real/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /hello@example.com/i })).toHaveAttribute("href", "mailto:hello@example.com");

    /**
     * The networks moved out of a pair of text links and into the carousel, so
     * this is now where every account is reachable from.
     */
    const carousel = screen.getByTestId("contact-carousel");
    for (const network of socialNetworks) {
      expect(within(carousel).getAllByText(network.name).length).toBeGreaterThan(0);
      expect(within(carousel).getAllByText(network.handle).length).toBeGreaterThan(0);
    }
  });

  /**
   * The rail is two identical copies, and only one of them is the list. Left
   * exposed, the duplicate reads five accounts out a second time and puts five
   * more stops in the tab order for links that are already there.
   */
  it("offers each account once, however many copies the rail carries", () => {
    render(
      <ContactSection
        contact={{
          email: "hello@example.com",
          linkedin: "https://linkedin.com/in/example",
          github: "https://github.com/example",
        }}
      />,
    );

    const carousel = within(screen.getByTestId("contact-carousel"));
    const reachable = [
      ...carousel.queryAllByRole("link"),
      ...carousel.queryAllByRole("button"),
    ];
    expect(reachable).toHaveLength(socialNetworks.length);

    /**
     * One of them is not a link, and that is the point: Discord names a person
     * rather than a page — its public profile URLs are built from a numeric id,
     * not from the username — so that card hands the name over instead of
     * pretending to have somewhere to go.
     */
    const addressable = socialNetworks.filter((network) => network.href !== null);
    expect(carousel.queryAllByRole("link")).toHaveLength(addressable.length);
    expect(carousel.queryAllByRole("button")).toHaveLength(
      socialNetworks.length - addressable.length,
    );
  });

  /**
   * De-duplicating with `inert` said far more than it meant to.
   *
   * Inert content never matches `:hover`, so the moment the loop carried the
   * duplicate copy into view every card stopped answering the pointer — to a
   * reader the hover simply worked once and then stopped. `aria-hidden` and
   * `tabindex="-1"` say the same thing about the copy without taking the
   * pointer with them.
   */
  it("keeps every copy of the rail answering the pointer", () => {
    render(
      <ContactSection
        contact={{
          email: "hello@example.com",
          linkedin: "https://linkedin.com/in/example",
          github: "https://github.com/example",
        }}
      />,
    );

    const carousel = screen.getByTestId("contact-carousel");
    expect(carousel.querySelectorAll("[inert]")).toHaveLength(0);

    // Every card is rendered, and only the spoken copy is in the tab order.
    const cards = carousel.querySelectorAll('[data-testid="contact-card"]');
    expect(cards.length).toBeGreaterThan(socialNetworks.length);
    const tabbable = [...cards].filter((card) => card.getAttribute("tabindex") !== "-1");
    expect(tabbable).toHaveLength(socialNetworks.length);
  });
});
