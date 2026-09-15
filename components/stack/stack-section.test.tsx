import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { StackGroup } from "@/content/portfolio";
import { stackIcons } from "@/lib/stack-icons";
import { contrastRatio, getStackIconColor } from "./stack-icon";
import { getMarqueeStep } from "./stack-marquee";
import { StackSection } from "./stack-section";

const groups: StackGroup[] = [
  {
    label: "Interface",
    items: [
      { name: "React", icon: "react", description: "Component library for interfaces." },
      { name: "Framer Motion", icon: "framer", description: "Animation library for React." },
    ],
  },
  {
    label: "Tooling",
    items: [
      { name: "Git", icon: "git", description: "Version control." },
      { name: "Playwright", icon: null, description: "Browser automation for end-to-end tests." },
    ],
  },
];

function renderSection() {
  return render(<StackSection groups={groups} items={["TypeScript", "React", "Next.js"]} />);
}

describe("StackSection", () => {
  it("renders every technology once in the semantic list", () => {
    renderSection();

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

  it("keeps both animated rails uninterrupted", () => {
    renderSection();

    expect(screen.queryByRole("button", { name: /pause|resume/i })).not.toBeInTheDocument();
  });

  it("centres its heading and omits the captions around the marquee", () => {
    renderSection();

    const heading = screen.getByRole("heading", { level: 2, name: /stack & tools/i });
    expect(heading.parentElement).toHaveClass("text-center");
    expect(screen.queryByText(/selected technologies/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/scroll responsive/i)).not.toBeInTheDocument();
  });

  it("meets the about with a straight edge as it rises over it", () => {
    const { container } = renderSection();
    const section = container.querySelector("#stack");

    // Opaque and square. The rounded corners this carried for a while exposed
    // the section underneath through the gap they cut at each top corner.
    expect(section).toHaveClass("bg-ink");
    expect(section?.className).not.toMatch(/rounded-t/);
  });

  it("renders the grouped inventory in the natural page flow", () => {
    renderSection();

    expect(screen.getByTestId("stack-grid")).toBeInTheDocument();
    expect(screen.queryByTestId("stack-pin-rail")).not.toBeInTheDocument();
    expect(screen.queryByTestId("stack-pin-frame")).not.toBeInTheDocument();
  });

  it("breaks the stack into labelled groups, each heading its own items", () => {
    renderSection();

    expect(screen.getAllByTestId("stack-group")).toHaveLength(2);

    for (const group of groups) {
      expect(screen.getByRole("heading", { level: 3, name: group.label })).toBeInTheDocument();

      // Each band names its own list, so the grouped inventory stays
      // distinguishable from the rails' sr-only mirror above it.
      const list = screen.getByRole("list", { name: new RegExp(`${group.label} technologies`, "i") });
      const entries = within(list).getAllByRole("listitem");
      expect(entries.map((entry) => entry.textContent)).toEqual(group.items.map((item) => item.name));
    }
  });

  it("draws a brand mark per tool and a neutral ring for the ones without one", () => {
    renderSection();

    // Three of the four fixture items carry a slug; Playwright has no icon in
    // the set and must still render something, or the row goes ragged.
    expect(screen.getAllByTestId("stack-icon")).toHaveLength(3);
    expect(screen.getAllByTestId("stack-icon-fallback")).toHaveLength(1);

    const react = screen.getAllByTestId("stack-icon")[0];
    expect(react).toHaveAttribute("fill", stackIcons.react.hex);
  });

  it("explains a tool in a panel when it is focused, and hides it again on Escape", async () => {
    const user = userEvent.setup();
    renderSection();

    expect(screen.queryByTestId("stack-tool-panel")).not.toBeInTheDocument();

    // Keyboard, not hover: the explanation must not be mouse-only.
    await user.tab();
    const [react] = screen.getAllByTestId("stack-tool");
    react.focus();

    const panel = await screen.findByTestId("stack-tool-panel");
    expect(panel).toHaveTextContent("Component library for interfaces.");

    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("stack-tool-panel")).not.toBeInTheDocument();
  });
});

describe("getStackIconColor", () => {
  it("keeps a brand colour that can actually be seen on the ink", () => {
    expect(getStackIconColor(stackIcons.react.hex)).toBe("#61DAFB");
    expect(getStackIconColor(stackIcons.javascript.hex)).toBe("#F7DF1E");
    // Framer's blue is the darkest colour that still survives the threshold —
    // it guards the cutoff from drifting up and washing the row out.
    expect(getStackIconColor(stackIcons.framer.hex)).toBe("#0055FF");
  });

  it("substitutes paper for marks that would vanish into the background", () => {
    // These published brand marks are pure black and need their light variant.
    for (const slug of [
      "nextdotjs",
      "threedotjs",
      "shadcnui",
      "jsonwebtokens",
    ] as const) {
      expect(getStackIconColor(stackIcons[slug].hex)).toBe("#f3f1ea");
    }
  });

  it("measures contrast symmetrically, per the WCAG definition", () => {
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 5);
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#090909", "#090909")).toBeCloseTo(1, 5);
  });

  it("judges against whatever ground it is given, not a hardcoded one", () => {
    // The same black that disappears on ink is the correct choice on paper.
    expect(getStackIconColor("#000000", "#f3f1ea")).toBe("#000000");
  });
});
