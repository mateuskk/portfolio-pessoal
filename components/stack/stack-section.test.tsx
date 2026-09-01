import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { getMarqueeStep } from "./stack-marquee";
import { StackSection } from "./stack-section";

describe("StackSection", () => {
  it("renders every technology once in the semantic list", () => {
    render(<StackSection items={["TypeScript", "React", "Next.js"]} />);

    const list = screen.getByRole("list", { name: /technology stack/i });
    expect(list).toHaveTextContent("TypeScript");
    expect(list).toHaveTextContent("React");
    expect(list).toHaveTextContent("Next.js");
    expect(list.querySelectorAll("li")).toHaveLength(3);
  });

  it("accelerates the rail with scroll velocity while preserving direction", () => {
    const resting = getMarqueeStep(16, 0, 1);
    const scrolling = getMarqueeStep(16, 1600, 1);

    expect(scrolling).toBeGreaterThan(resting);
    expect(getMarqueeStep(16, 1600, -1)).toBeCloseTo(-scrolling);
    expect(scrolling).toBeLessThanOrEqual(0.08);
  });

  it("offers keyboard-accessible controls that pause each animated rail", async () => {
    const user = userEvent.setup();
    render(<StackSection items={["TypeScript", "React", "Next.js"]} />);

    const controls = screen.getAllByRole("button", { name: /pause technology rail/i });
    expect(controls).toHaveLength(2);
    await user.click(controls[0]);
    expect(controls[0]).toHaveAttribute("aria-pressed", "true");
  });
});
