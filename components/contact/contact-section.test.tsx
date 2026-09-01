import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ContactSection } from "./contact-section";

describe("ContactSection", () => {
  it("exposes direct contact and social destinations", () => {
    render(
      <ContactSection
        contact={{
          email: "hello@example.com",
          linkedin: "https://linkedin.com/in/example",
          github: "https://github.com/example",
        }}
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: /have a project in mind.*make it real/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /hello@example.com/i })).toHaveAttribute("href", "mailto:hello@example.com");
    expect(screen.getByRole("link", { name: /linkedin/i })).toHaveAttribute("href", "https://linkedin.com/in/example");
    expect(screen.getByRole("link", { name: /github/i })).toHaveAttribute("href", "https://github.com/example");
  });
});
