import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { completeIntro, startIntro } from "@/lib/intro";
import { getHeroVisualAnimation, Hero } from "./hero";

const heroSceneSpy = vi.hoisted(() => vi.fn((_props: unknown) => null));

vi.mock("./hero-scene", () => ({ HeroScene: heroSceneSpy }));

describe("Hero", () => {
  beforeEach(() => {
    startIntro();
    heroSceneSpy.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("keeps identity and the visual stage available without WebGL", () => {
    render(
      <Hero
        content={{
          name: "Seu Nome",
          role: "Creative Developer",
          intro: "Olá, eu sou Mateus Bastos.",
          location: "São Paulo, BR",
          availability: "Available for selected projects",
        }}
      />,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Creative Developer");
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
          intro: "Olá, eu sou Mateus Bastos.",
          location: "São Paulo, BR",
          availability: "Available for selected projects",
        }}
      />,
    );

    expect(screen.getByText(/Olá, eu sou Mateus Bastos/i)).not.toHaveStyle({ opacity: "0" });
  });

  it("keeps the original typography container free from layout transforms", () => {
    render(
      <Hero
        content={{
          name: "Seu Nome",
          role: "FullStack Developer",
          intro: "Olá, eu sou Mateus Bastos.",
          location: "São Paulo, BR",
          availability: "Available for selected projects",
        }}
      />,
    );

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("FullStack Developer");
    expect(heading).toHaveClass("font-display", "font-medium", "leading-[0.66]");
    expect(heading.parentElement).not.toHaveStyle({ transform: "translateY(18px)" });
    expect(screen.getByTestId("hero-split-primary")).toBeInTheDocument();
    const editorialWrapper = screen.getByTestId("hero-split-editorial");
    expect(editorialWrapper).toHaveClass("-mt-[0.26em]");
    // `font-editorial`, not the site's general serif: this one word is the only
    // place that face is set, which is why it has a token of its own.
    const editorial = editorialWrapper.querySelector(".font-editorial");
    expect(editorial).toHaveTextContent("Developer");
    expect(editorial).toHaveClass("font-editorial", "italic", "text-paper/80");
    const intro = screen.getByTestId("hero-split-intro").querySelector("p");
    expect(intro).toHaveTextContent("Olá, eu sou Mateus Bastos");
    expect(intro).toHaveClass("text-pretty", "text-center", "tracking-[-0.01em]");
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
          intro: "Olá, eu sou Mateus Bastos.",
          location: "São Paulo, BR",
          availability: "Available for selected projects",
        }}
      />,
    );

    expect(container.querySelector('[data-testid="hero-visual"] .rounded-full')).not.toBeInTheDocument();
  });

  it("limits desktop pointer interaction to the 3D visual stage", async () => {
    completeIntro();
    vi.stubGlobal("WebGLRenderingContext", class WebGLRenderingContext {});
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      matches: query.includes("min-width: 768px"),
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }) as unknown as MediaQueryList);

    render(
      <Hero
        content={{
          name: "Seu Nome",
          role: "Creative Developer",
          intro: "Olá, eu sou Mateus Bastos.",
          location: "São Paulo, BR",
          availability: "Available for selected projects",
        }}
      />,
    );

    await waitFor(() => expect(heroSceneSpy).toHaveBeenCalled());

    const sceneProps = heroSceneSpy.mock.lastCall?.[0] as {
      pointerTarget?: { current: HTMLElement | null };
    };
    expect(sceneProps.pointerTarget?.current).toBe(screen.getByTestId("hero-visual"));
  });
});
