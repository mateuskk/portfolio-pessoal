import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const viewports = [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 820, height: 1180 },
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

  await expect(page.getByRole("article", { name: "Obsidian" })).toBeVisible();
  await page.locator("#projects").evaluate((section) => {
    const top = window.scrollY + section.getBoundingClientRect().top;
    const range = section.getBoundingClientRect().height - window.innerHeight;
    window.scrollTo({ top: top + range * 0.6, behavior: "instant" });
  });
  await expect(page.getByRole("article", { name: "Forma" })).toBeVisible();
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

for (const viewport of [viewports[0], viewports[2]]) {
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
