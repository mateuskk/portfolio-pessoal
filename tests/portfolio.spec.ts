import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const viewports = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'tablet landscape', width: 960, height: 800 },
  { name: 'laptop', width: 1440, height: 900 },
  { name: 'wide', width: 1920, height: 1080 },
];

for (const viewport of viewports) {
  test(`${viewport.name} has no horizontal page overflow`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const widths = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));

    expect(widths.scroll).toBeLessThanOrEqual(widths.client + 1);
  });
}

test('opening motion begins after the loading transition', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const loader = page.getByRole('status', { name: /loading portfolio/i });
  const navbar = page.getByRole('navigation', { name: /primary navigation/i });
  await expect(loader).toBeVisible();
  await expect(loader.getByTestId('loading-panel')).toHaveCount(2);
  await expect(loader).toBeHidden();
  await expect(navbar).toHaveCSS('opacity', '1');

  await page.reload();
  await expect(loader).toBeVisible();
  await expect(loader).toBeHidden();
  await expect(navbar).toHaveCSS('opacity', '1');
});

test('desktop 3D canvas keeps filling its stage after the intro', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();

  const canvas = page.getByTestId('hero-visual').locator('canvas');
  await expect(canvas).toBeVisible();

  const uncoveredSpace = await canvas.evaluate((element) => {
    const canvasRect = element.getBoundingClientRect();
    const stageRect = element.parentElement?.getBoundingClientRect();
    if (!stageRect) {
      return {
        bottom: Number.POSITIVE_INFINITY,
        right: Number.POSITIVE_INFINITY,
      };
    }

    return {
      bottom: Math.abs(stageRect.bottom - canvasRect.bottom),
      right: Math.abs(stageRect.right - canvasRect.right),
    };
  });

  expect(uncoveredSpace.bottom).toBeLessThanOrEqual(1);
  expect(uncoveredSpace.right).toBeLessThanOrEqual(1);
});

test('desktop never exposes the mobile fallback between the loader and the 3D scene', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    const state = window as unknown as { __heroFallbackSeen: boolean };
    state.__heroFallbackSeen = false;

    new MutationObserver(() => {
      if (document.querySelector('[data-testid="hero-visual"] .rounded-full')) {
        state.__heroFallbackSeen = true;
      }
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto('/');
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();
  await page.waitForTimeout(400);

  const fallbackSeen = await page.evaluate(
    () =>
      (window as unknown as { __heroFallbackSeen: boolean }).__heroFallbackSeen,
  );
  expect(fallbackSeen).toBe(false);
});

test('hero split stays dormant until ready and then opens from the center', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const transition = page.getByTestId('hero-about-transition');
  const topPanel = page.getByTestId('hero-split-panel-top');
  const bottomPanel = page.getByTestId('hero-split-panel-bottom');

  await transition.evaluate(() =>
    window.scrollTo({ top: 700, behavior: 'instant' }),
  );
  await page.waitForTimeout(180);
  await expect(transition).toHaveAttribute('data-transition-ready', 'false');

  const dormantHeights = await Promise.all([
    topPanel.evaluate((panel) => panel.getBoundingClientRect().height),
    bottomPanel.evaluate((panel) => panel.getBoundingClientRect().height),
  ]);
  expect(dormantHeights.every((height) => height <= 1)).toBe(true);

  await transition.evaluate(() =>
    window.scrollTo({ top: 0, behavior: 'instant' }),
  );
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();
  await expect(transition).toHaveAttribute('data-transition-ready', 'true', {
    timeout: 4000,
  });

  const initialAction = await page
    .getByTestId('hero-split-action')
    .evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y };
    });
  expect(initialAction.x).toBeLessThan(360);
  expect(initialAction.y).toBeGreaterThan(650);

  const initialText = await page
    .getByTestId('hero-split-primary')
    .evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y };
    });

  await transition.evaluate((element) => {
    const start = window.scrollY + element.getBoundingClientRect().top;
    window.scrollTo({
      top: start + window.innerHeight * 1.08,
      behavior: 'instant',
    });
  });
  await page.waitForTimeout(850);

  const geometry = await page.evaluate(() => {
    const top = document
      .querySelector('[data-testid="hero-split-panel-top"]')!
      .getBoundingClientRect();
    const bottom = document
      .querySelector('[data-testid="hero-split-panel-bottom"]')!
      .getBoundingClientRect();
    return {
      viewportHeight: window.innerHeight,
      centerOverlap: top.bottom - bottom.top,
      top: { top: top.top, bottom: top.bottom, height: top.height },
      bottom: { top: bottom.top, bottom: bottom.bottom, height: bottom.height },
    };
  });
  const finalText = await page
    .getByTestId('hero-split-primary')
    .evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y };
    });

  expect(Math.abs(geometry.top.top)).toBeLessThanOrEqual(2);
  expect(
    Math.abs(geometry.top.bottom - geometry.viewportHeight / 2),
  ).toBeLessThanOrEqual(3);
  expect(
    Math.abs(geometry.bottom.top - geometry.viewportHeight / 2),
  ).toBeLessThanOrEqual(3);
  expect(
    Math.abs(geometry.bottom.bottom - geometry.viewportHeight),
  ).toBeLessThanOrEqual(2);
  expect(geometry.centerOverlap).toBeGreaterThanOrEqual(2);
  expect(finalText.x).toBeLessThan(initialText.x - 20);
  expect(finalText.y).toBeLessThan(initialText.y - 40);
  await expect(page.getByTestId('hero-sticky-content')).toHaveAttribute(
    'aria-hidden',
    'true',
  );
  await expect(page.locator('#about')).toHaveAttribute('data-tone', 'paper');
});

test('mobile navigation and projects remain directly operable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const menuButton = page.getByRole('button', { name: /open menu/i });
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeVisible();
  await menuButton.click();
  await expect(page.getByRole('dialog', { name: /navigation/i })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: /navigation/i })).toBeHidden();

  await page.locator('#projects').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: /next project/i }).click();
  await expect(page.getByRole('article', { name: 'Monolith' })).toHaveAttribute(
    'aria-current',
    'true',
  );
});

test('landscape tablet tracks the nearest capped project card', async ({
  page,
}) => {
  await page.setViewportSize({ width: 960, height: 800 });
  await page.goto('/');
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();

  const carousel = page.getByRole('region', { name: /selected projects/i });
  await carousel.evaluate((rail) => {
    rail.scrollTo({ left: rail.scrollWidth, behavior: 'instant' });
    rail.dispatchEvent(new Event('scroll'));
  });

  await expect(page.getByText('Project 04 / 04')).toBeVisible();
  await expect(
    page.getByRole('button', { name: /next project/i }),
  ).toBeDisabled();
});

test('desktop retains the complete sticky project narrative', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const geometry = await page.locator('#projects').evaluate((section) => {
    const sticky = section.querySelector('.sticky');
    return {
      height: section.getBoundingClientRect().height,
      stickyPosition: sticky ? getComputedStyle(sticky).position : 'missing',
    };
  });

  expect(geometry.height).toBeGreaterThanOrEqual(3500);
  expect(geometry.stickyPosition).toBe('sticky');

  const stage = page.getByTestId('desktop-project-stage');
  await expect(
    page.getByRole('heading', { level: 2, name: 'Selected work' }),
  ).toHaveCount(1);
  await expect(
    page.getByRole('list', { name: 'All selected projects' }),
  ).toHaveCount(1);
  await expect(stage).toHaveAttribute('data-active-project', 'obsidian');
  await page.locator('#projects').evaluate((section) => {
    const top = window.scrollY + section.getBoundingClientRect().top;
    const range = section.getBoundingClientRect().height - window.innerHeight;
    window.scrollTo({ top: top + range * 0.6, behavior: 'instant' });
  });
  await expect(stage).toHaveAttribute('data-active-project', 'forma');
});

test('reduced motion keeps essential content visible and skips the intro', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'About me' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Stack & tools' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Selected work' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: /have a project in mind.*make it real/i,
    }),
  ).toBeVisible();
});

test('keyboard users reach the skip link first', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');

  const skipLink = page.getByRole('link', { name: /skip to content/i });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();
  await expect(skipLink).toHaveAttribute('href', '#main-content');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main-content$/);
  await expect(page.locator('#main-content')).toBeFocused();
});

for (const viewport of [viewports[0], viewports[3]]) {
  test(`${viewport.name} has no automated WCAG A or AA violations`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
}
