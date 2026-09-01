import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const viewports = [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "tablet landscape", width: 960, height: 800 },
  { name: "laptop", width: 1440, height: 900 },
  { name: "wide", width: 1920, height: 1080 },
];

for (const viewport of viewports) {
  test(`${viewport.name} has no horizontal page overflow`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const widths = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));

    expect(widths.scroll).toBeLessThanOrEqual(widths.client + 1);
  });
}

test("opening motion begins after the loading transition", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const loader = page.getByRole("status", { name: /loading portfolio/i });
  const navbar = page.getByRole("navigation", { name: /primary navigation/i });
  await expect(loader).toBeVisible();
  await expect(navbar).toHaveCSS("opacity", "0");
  await expect(loader).toBeHidden();
  await expect(navbar).toHaveCSS("opacity", "1");
});

test("mobile navigation and projects remain directly operable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const menuButton = page.getByRole("button", { name: /open menu/i });
  await expect(page.getByRole("status", { name: /loading portfolio/i })).toBeVisible();
  await menuButton.click();
  await expect(page.getByRole("dialog", { name: /navigation/i })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: /navigation/i })).toBeHidden();

  await page.locator("#projects").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: /next project/i }).click();
  await expect(page.getByRole("article", { name: "Monolith" })).toHaveAttribute("aria-current", "true");
});

test("landscape tablet tracks the nearest capped project card", async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 800 });
  await page.goto("/");
  await expect(page.getByRole("status", { name: /loading portfolio/i })).toBeHidden();

  const carousel = page.getByRole("region", { name: /selected projects/i });
  await carousel.evaluate((rail) => {
    rail.scrollTo({ left: rail.scrollWidth, behavior: "instant" });
    rail.dispatchEvent(new Event("scroll"));
  });

  await expect(page.getByText("Project 04 / 04")).toBeVisible();
  await expect(page.getByRole("button", { name: /next project/i })).toBeDisabled();
});

test("desktop retains the complete sticky project narrative", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const geometry = await page.locator("#projects").evaluate((section) => {
    const sticky = section.querySelector(".sticky");
    return {
      height: section.getBoundingClientRect().height,
      stickyPosition: sticky ? getComputedStyle(sticky).position : "missing",
    };
  });

  expect(geometry.height).toBeGreaterThanOrEqual(3500);
  expect(geometry.stickyPosition).toBe("sticky");

  const stage = page.getByTestId("desktop-project-stage");
  await expect(page.getByRole("heading", { level: 2, name: "Selected work" })).toHaveCount(1);
  await expect(page.getByRole("list", { name: "All selected projects" })).toHaveCount(1);
  await expect(stage).toHaveAttribute("data-active-project", "obsidian");
  await page.locator("#projects").evaluate((section) => {
    const top = window.scrollY + section.getBoundingClientRect().top;
    const range = section.getBoundingClientRect().height - window.innerHeight;
    window.scrollTo({ top: top + range * 0.6, behavior: "instant" });
  });
  await expect(stage).toHaveAttribute("data-active-project", "forma");
});

test("reduced motion keeps essential content visible and skips the intro", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.getByRole("status", { name: /loading portfolio/i })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "About me" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Stack & tools" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Selected work" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /have a project in mind.*make it real/i })).toBeVisible();
});

test("keyboard users reach the skip link first", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");

  const skipLink = page.getByRole("link", { name: /skip to content/i });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();
  await expect(skipLink).toHaveAttribute("href", "#main-content");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main-content$/);
  await expect(page.locator("#main-content")).toBeFocused();
});

for (const viewport of [viewports[0], viewports[3]]) {
  test(`${viewport.name} has no automated WCAG A or AA violations`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });
}
