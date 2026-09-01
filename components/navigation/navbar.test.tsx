import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { Navbar } from "./navbar";

const items = [
  { label: "About", href: "#about" as const },
  { label: "Projects", href: "#projects" as const },
];

describe("Navbar", () => {
  afterEach(() => {
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
  });

  it("exposes desktop links and an accessible dismissible mobile dialog", async () => {
    const user = userEvent.setup();
    render(<Navbar items={items} initials="SN" email="hello@example.com" />);

    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "#about");
    await user.click(screen.getByRole("button", { name: /open menu/i }));
    expect(screen.getByRole("dialog", { name: /navigation/i })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: /navigation/i })).not.toBeInTheDocument();
  });

  it("contracts after the page starts scrolling", () => {
    render(<Navbar items={items} initials="SN" email="hello@example.com" />);
    Object.defineProperty(window, "scrollY", { configurable: true, value: 80 });

    fireEvent.scroll(window);

    expect(screen.getByRole("navigation")).toHaveAttribute("data-compact", "true");
  });
});
