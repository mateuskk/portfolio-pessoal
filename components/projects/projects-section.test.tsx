import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { progressToProjectIndex } from "@/hooks/use-project-progress";
import { getProjectTilt, supportsProjectTilt } from "./project-art";
import { findNearestProjectIndex, ProjectsSection } from "./projects-section";

const projects = [
  {
    slug: "one",
    index: "01",
    title: "Obsidian",
    year: "2026",
    role: "Design & Development",
    summary: "A monochrome product experience built around clarity and motion.",
    stack: ["Next.js", "Motion"],
    artDirection: "orbital" as const,
  },
  {
    slug: "two",
    index: "02",
    title: "Monolith",
    year: "2026",
    role: "Frontend",
    summary: "An editorial platform with a precise modular publishing system.",
    stack: ["React", "TypeScript"],
    artDirection: "grid" as const,
  },
];

describe("ProjectsSection", () => {
  it("lists projects and changes the active project with controls", async () => {
    const user = userEvent.setup();
    render(<ProjectsSection projects={projects} />);

    expect(screen.getByRole("article", { name: "Obsidian" })).toHaveAttribute("aria-current", "true");
    await user.click(screen.getByRole("button", { name: /next project/i }));
    expect(screen.getByRole("article", { name: "Monolith" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: /next project/i })).toBeDisabled();
    expect(screen.queryByRole("link", { name: /case study/i })).not.toBeInTheDocument();
    expect(screen.getAllByText("Case study / Soon").length).toBeGreaterThan(0);
  });

  it("supports arrow-key navigation and announces the active position", async () => {
    const user = userEvent.setup();
    render(<ProjectsSection projects={projects} />);

    const carousel = screen.getByRole("region", { name: /selected projects/i });
    await user.click(carousel);
    await user.keyboard("{ArrowRight}");

    expect(screen.getByText("Project 02 / 02")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByRole("button", { name: /previous project/i })).toBeEnabled();
  });

  it("maps scroll progress and pointer depth to bounded project states", () => {
    expect(progressToProjectIndex(0, 4)).toBe(0);
    expect(progressToProjectIndex(0.51, 4)).toBe(2);
    expect(progressToProjectIndex(1, 4)).toBe(3);
    expect(getProjectTilt(500, -500, { left: 0, top: 0, width: 100, height: 100 })).toEqual({
      rotateX: 5,
      rotateY: 5,
      z: 28,
    });
    expect(supportsProjectTilt("touch", false, true)).toBe(false);
    expect(supportsProjectTilt("mouse", true, true)).toBe(false);
    expect(supportsProjectTilt("mouse", false, true)).toBe(true);
  });

  it("uses actual card geometry for landscape-tablet carousel state", () => {
    const cards = [48, 800, 1552, 2304].map((offsetLeft) => ({ offsetLeft, offsetWidth: 736 }));

    expect(findNearestProjectIndex(2168, 920, cards)).toBe(3);
  });

  it("provides a complete semantic desktop collection independent of the animated stage", () => {
    render(<ProjectsSection projects={projects} />);

    const list = screen.getByRole("list", { name: "All selected projects" });
    expect(within(list).getByRole("heading", { name: "Obsidian" })).toBeInTheDocument();
    expect(within(list).getByRole("heading", { name: "Monolith" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "Selected work" })).toHaveLength(2);
    expect(screen.getByTestId("desktop-project-stage").parentElement).not.toHaveAttribute("inert");
  });
});
