import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MagneticLink } from "./magnetic-link";
import { RevealText } from "./reveal-text";
import { SectionHeading } from "./section-heading";

describe("portfolio primitives", () => {
  it("exposes section context as a named heading", () => {
    render(<SectionHeading index="001" eyebrow="Profile" title="About me" />);

    expect(screen.getByText("[ 001 ]")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "About me" })).toBeInTheDocument();
  });

  it("keeps reveal copy available in the rendered document", () => {
    render(<RevealText>Always readable</RevealText>);

    expect(screen.getByText("Always readable")).toBeVisible();
  });

  it("renders magnetic interactions as ordinary accessible links", () => {
    render(<MagneticLink href="#projects">See projects</MagneticLink>);

    expect(screen.getByRole("link", { name: "See projects" })).toHaveAttribute("href", "#projects");
  });
});
