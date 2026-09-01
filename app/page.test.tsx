import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("portfolio shell", () => {
  it("keeps the primary content and footer in the document flow", () => {
    render(<Home />);

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: /selected work/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });
});
