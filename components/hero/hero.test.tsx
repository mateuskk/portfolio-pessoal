import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { completeIntro, startIntro } from "@/lib/intro";
import { getHeroVisualAnimation, Hero } from "./hero";

describe("Hero", () => {
  beforeEach(() => startIntro());

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("keeps identity and the primary project action available without WebGL", () => {
    render(
      <Hero
        content={{
          name: "Seu Nome",
          role: "Creative Developer",
          location: "São Paulo, BR",
          availability: "Available for selected projects",
        }}
      />,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Creative Developer");
    expect(screen.getByRole("link", { name: /explore projects/i })).toHaveAttribute("href", "#projects");
    expect(screen.getByTestId("hero-visual")).toHaveAttribute("aria-hidden", "true");
  });

  it("does not hide introductory copy when motion is reduced initially", () => {
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      matches: query.includes("prefers-reduced-motion: reduce"),
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }) as unknown as MediaQueryList);

    render(
      <Hero
        content={{
          name: "Seu Nome",
          role: "Creative Developer",
          location: "São Paulo, BR",
          availability: "Available for selected projects",
        }}
      />,
    );

    expect(screen.getByText(/I shape precise digital experiences/i)).not.toHaveStyle({ opacity: "0" });
  });

  it("keeps the original typography container free from layout transforms", () => {
    render(
      <Hero
        content={{
          name: "Seu Nome",
          role: "Creative Developer",
          location: "São Paulo, BR",
          availability: "Available for selected projects",
        }}
      />,
    );

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveClass("text-display", "font-medium");
    expect(heading.parentElement).not.toHaveStyle({ transform: "translateY(18px)" });
    expect(screen.getByText("Developer")).toHaveClass("font-serif", "italic");
  });

  it("reveals the 3D stage with a clean mask and never scales its canvas container", () => {
    const animation = getHeroVisualAnimation(false);

    expect(animation.initial).toEqual({ opacity: 0, clipPath: "inset(0 0 0 18%)" });
    expect(animation.animate).toEqual({ opacity: 1, clipPath: "inset(0 0 0 0%)" });
    expect(animation.initial).not.toHaveProperty("scale");
    expect(animation.animate).not.toHaveProperty("scale");
  });

  it("keeps the preloaded 3D stage hidden until the intro is ready", () => {
    expect(getHeroVisualAnimation(false, false).animate).toEqual({
      opacity: 0,
      clipPath: "inset(0 0 0 18%)",
    });
  });

  it("does not show the mobile fallback while the desktop scene is loading", () => {
    completeIntro();
    vi.stubGlobal("WebGLRenderingContext", class WebGLRenderingContext {});
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      matches: query.includes("min-width: 768px"),
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }) as unknown as MediaQueryList);

    const { container } = render(
      <Hero
        content={{
          name: "Seu Nome",
          role: "Creative Developer",
          location: "São Paulo, BR",
          availability: "Available for selected projects",
        }}
      />,
    );

    expect(container.querySelector('[data-testid="hero-visual"] .rounded-full')).not.toBeInTheDocument();
  });
});
