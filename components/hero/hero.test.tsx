import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Hero } from "./hero";

describe("Hero", () => {
  afterEach(() => vi.restoreAllMocks());

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
});
