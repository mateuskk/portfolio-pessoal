import { describe, expect, it } from "vitest";

import { portfolioContent } from "./portfolio";

describe("portfolio content", () => {
  it("keeps all navigation targets and complete projects in one source", () => {
    expect(portfolioContent.navigation.map((item) => item.href)).toEqual([
      "#about",
      "#stack",
      "#projects",
      "#contact",
    ]);
    expect(portfolioContent.projects).toHaveLength(4);

    for (const project of portfolioContent.projects) {
      expect(project.title.length).toBeGreaterThan(2);
      expect(project.summary.length).toBeGreaterThan(20);
      expect(project.stack.length).toBeGreaterThan(1);
    }
  });
});
