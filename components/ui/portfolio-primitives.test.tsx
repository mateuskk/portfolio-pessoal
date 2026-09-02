import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getMagneticMotion, getMagneticOffset, MagneticLink } from "./magnetic-link";
import { RevealText } from "./reveal-text";
import { SectionHeading } from "./section-heading";
import { introRevealItem, revealItem } from "@/lib/motion";

describe("portfolio primitives", () => {
  it("exposes section context as a named heading", () => {
    render(<SectionHeading eyebrow="Profile" title="About me" />);

    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "About me" })).toHaveClass("font-serif");
  });

  it("keeps reveal copy available in the rendered document", () => {
    render(<RevealText>Always readable</RevealText>);

    expect(screen.getByText("Always readable")).toBeVisible();
  });

  it("does not place block reveal copy inside an inline wrapper", () => {
    render(<RevealText as="p">Block copy</RevealText>);

    expect(screen.getByText("Block copy").parentElement?.tagName).not.toBe("SPAN");
  });

  it("renders magnetic interactions as ordinary accessible links", () => {
    render(<MagneticLink href="#projects">See projects</MagneticLink>);

    expect(screen.getByRole("link", { name: "See projects" })).toHaveAttribute("href", "#projects");
  });

  it("caps magnetic movement at eight pixels even with excessive strength", () => {
    expect(getMagneticOffset(200, 200, { left: 0, top: 0, width: 100, height: 100 }, 40)).toEqual({ x: 8, y: 8 });
  });

  it("cancels and resets an active magnetic displacement for reduced motion", () => {
    expect(getMagneticMotion(true, { x: 8, y: -8 })).toEqual({
      animation: { x: 0, y: 0 },
      transition: { duration: 0 },
    });
  });

  it("keeps blur reserved for text reveal states", () => {
    expect(revealItem.hidden).toMatchObject({ filter: "blur(10px)" });
    expect(introRevealItem.hidden).toMatchObject({ filter: "blur(12px)" });
  });
});
