import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { portfolioContent } from '../content/portfolio';

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
  await expect(loader.getByTestId('loading-veil')).toBeVisible();
  await expect(loader.getByTestId('loading-ring')).toBeVisible();
  await expect(loader).toContainText('MB');
  await expect(loader).toBeHidden();
  await expect(navbar).toHaveCSS('opacity', '1');

  await page.reload();
  await expect(loader).toBeVisible();
  await expect(loader).toBeHidden();
  await expect(navbar).toHaveCSS('opacity', '1');
});

test('global scrolling keeps easing beyond the 1.65 second cutoff', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(300);

  /**
   * Timed from inside the page, by watching when the position last changed.
   *
   * It used to sample `window.scrollY` at 1700ms and again 120ms later and
   * require the difference to be positive. That reads as a measure of the tail
   * and is really a coin toss: the whole tail past 1.65s is about one pixel,
   * `scrollY` reports whole pixels, so the assertion came down to whether that
   * single increment happened to fall inside the sampled window. It passed and
   * failed on identical builds all through a day's work, which is worse than no
   * test, because a suite that cries wolf gets read as noise when something
   * real breaks.
   *
   * This asks the question the name asks instead: at what moment does the page
   * finally stop?
   */
  await page.evaluate(() => {
    const store = window as unknown as { __rest?: number; __start?: number };
    store.__start = performance.now();
    store.__rest = performance.now();
    let last = window.scrollY;
    const watch = () => {
      if (window.scrollY !== last) {
        last = window.scrollY;
        store.__rest = performance.now();
      }
      requestAnimationFrame(watch);
    };
    requestAnimationFrame(watch);
  });

  await page.mouse.move(720, 450);
  await page.mouse.wheel(0, 1200);
  await page.waitForTimeout(3000);

  const easedFor = await page.evaluate(() => {
    const store = window as unknown as { __rest: number; __start: number };
    return store.__rest - store.__start;
  });

  // The previous 1.65s setting had already come to rest by here. The slower
  // global inertia has to still be moving past it, which is the softer, longer
  // response requested for ordinary page scrolling.
  expect(easedFor).toBeGreaterThan(1650);
});

test('global wheel input travels 65 percent of its raw distance', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(300);
  await page.mouse.move(720, 450);
  await page.mouse.wheel(0, 1200);
  await page.waitForTimeout(2100);

  const travelled = await page.evaluate(() => window.scrollY);
  expect(travelled).toBeGreaterThan(720);
  expect(travelled).toBeLessThan(840);
});

test('the mark is written stroke by stroke, not switched on', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  // Sampled inside the page on rAF rather than polled from here. Wall-clock
  // polling across the driver cannot reliably catch a 2s animation at a chosen
  // instant, and the whole question is what the intermediate frames look like.
  await page.addInitScript(() => {
    const trace: number[][] = [];
    (window as Window & { __penTrace?: number[][] }).__penTrace = trace;

    const sample = () => {
      // The mask strokes, not the letterform: the glyph itself never animates,
      // it is only uncovered by these.
      const strokes = document.querySelectorAll(
        '[data-testid="loading-mb"] mask path',
      );
      if (strokes.length > 0) {
        // pathLength="1" normalises the dash units, so the offset runs 1 -> 0
        // and the drawn fraction is what is left of it.
        trace.push(
          [...strokes].map(
            (s) => 1 - (parseFloat(getComputedStyle(s).strokeDashoffset) || 0),
          ),
        );
      }
      if (trace.length < 400) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });

  await page.goto('/');
  const loader = page.getByRole('status', { name: /loading portfolio/i });
  await expect(loader).toBeVisible();
  await expect(loader).toBeHidden();

  const trace = await page.evaluate(
    () => (window as Window & { __penTrace?: number[][] }).__penTrace ?? [],
  );
  expect(trace.length).toBeGreaterThan(30);

  const drawn = (index: number) => trace.map((frame) => frame[index] ?? 0);

  // Every stroke gets fully drawn, and none of them ever un-draws.
  for (let index = 0; index < 3; index += 1) {
    const series = drawn(index);
    expect(Math.max(...series)).toBeGreaterThan(0.99);
    for (let i = 1; i < series.length; i += 1) {
      expect(series[i]).toBeGreaterThanOrEqual(series[i - 1] - 0.001);
    }
  }

  // Caught in the act: frames showing a stroke part-drawn. A mark that simply
  // appeared would jump 0 to 1 between two frames and never show one.
  //
  // Asked of the strokes as a group rather than of the M alone, because the
  // page stalls for most of a second early on while it hydrates and the canvas
  // starts. Frames vanish wholesale there, and an assertion aimed at one
  // stroke's window can land entirely inside the gap.
  const midStroke = trace.filter((frame) =>
    frame.some((f) => f > 0.05 && f < 0.95),
  );
  expect(midStroke.length).toBeGreaterThan(20);

  // The hand works in order and never runs ahead of itself: within any frame,
  // no stroke is further along than the one before it.
  for (const frame of trace) {
    for (let index = 1; index < 3; index += 1) {
      expect(frame[index]).toBeLessThanOrEqual(frame[index - 1] + 0.001);
    }
  }

  // Sequenced, not simultaneous — the bowls have not been started at all while
  // the M is still going.
  const untouchedBowls = trace.filter(
    (frame) => frame[0] < 0.999 && frame[2] === 0,
  );
  expect(untouchedBowls.length).toBeGreaterThan(5);
});

/**
 * The desktop size has to actually reach the title.
 *
 * It did not, for a long time, and nothing said so: the class named a size that
 * looked like a utility and was hand-written CSS, so Tailwind never emitted the
 * `sm:` variant and the phone clamp governed every width. Both rules top out at
 * 12rem, which is why the defect hid on a wide monitor and only showed on a
 * laptop, where the title ran 13% large and pushed `Developer` into the
 * sculpture. Measured rather than asserted against the class list, because the
 * class list was exactly what looked correct.
 */
test('the hero title takes its desktop size rather than the phone clamp', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();

  const size = await page
    .locator('#hero-title')
    .evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));

  // 11.8vw of 1440 is 169.9. The phone clamp is 14vw, which is already past the
  // 192px ceiling here, so anything at the ceiling means the desktop rule never
  // applied.
  expect(size).toBeGreaterThan(165);
  expect(size).toBeLessThan(175);
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

test('the desktop 3D stage stays decorative without intercepting Hero input', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();

  const hero = page.locator('section[aria-labelledby="hero-title"]');
  const visual = page.getByTestId('hero-visual');
  await expect(visual.locator('canvas')).toBeVisible();

  const pointerAccess = await hero.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const visual = element.querySelector('[data-testid="hero-visual"]');
    const points = [0.12, 0.5, 0.88].map((fraction) => {
      const hit = document.elementFromPoint(
        bounds.left + bounds.width * fraction,
        bounds.top + bounds.height * 0.5,
      );
      return Boolean(hit && element.contains(hit));
    });

    return {
      visualPointerEvents: visual ? getComputedStyle(visual).pointerEvents : '',
      fullHeroIsReachable: points.every(Boolean),
    };
  });

  expect(pointerAccess.visualPointerEvents).toBe('none');
  expect(pointerAccess.fullHeroIsReachable).toBe(true);
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

test('about copy waits for the paper to close and un-reveals on the way back up', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const transition = page.getByTestId('hero-about-transition');
  const about = page.locator('#about');
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();
  await expect(transition).toHaveAttribute('data-transition-ready', 'true', {
    timeout: 4000,
  });

  // Measured against the split's own rail rather than the whole transition
  // element: the about now carries a pin rail of its own, so the element's
  // height is no longer proportional to the split's scroll range.
  const scrollIntoTransition = (fraction: number) =>
    page.getByTestId('hero-split-rail').evaluate((element, ratio) => {
      const rect = element.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      window.scrollTo({
        top: rect.top + window.scrollY + span * ratio,
        behavior: 'instant',
      });
    }, fraction);

  // Mid-transition the about copy still overlaps the uncovered hero.
  await scrollIntoTransition(0.3);
  await page.waitForTimeout(700);
  await expect(about).toHaveAttribute('data-revealed', 'false');

  await scrollIntoTransition(1);
  await expect(about).toHaveAttribute('data-revealed', 'true', {
    timeout: 2000,
  });

  await scrollIntoTransition(0.3);
  await expect(about).toHaveAttribute('data-revealed', 'false', {
    timeout: 2000,
  });
});

for (const viewport of [
  // The small phone is the tightest of these by far — 635px of copy in a 667px
  // viewport — so it is the one that will fail first if the about grows.
  { name: 'small phone', width: 390, height: 667 },
  { name: 'short laptop', width: 1024, height: 768 },
  { name: 'laptop', width: 1440, height: 900 },
]) {
  test(`${viewport.name} holds the about still while the stack transition scrolls`, async ({
    page,
  }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await page.goto('/');
    await expect(
      page.getByRole('status', { name: /loading portfolio/i }),
    ).toBeHidden();
    await expect(page.getByTestId('hero-about-transition')).toHaveAttribute(
      'data-transition-ready',
      'true',
      { timeout: 4000 },
    );

    const railTop = await page
      .getByTestId('about-pin-rail')
      .evaluate(
        (element) => element.getBoundingClientRect().top + window.scrollY,
      );

    // Measured on the pinned frame, not on `#about` itself: the section is
    // scaled as it hands over to the stack, and a transform moves its bounding
    // box even while the element is standing still.
    const frame = () =>
      page.getByTestId('about-pin-frame').evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return { top: Math.round(rect.top), bottom: Math.round(rect.bottom) };
      });
    const copyBox = () =>
      page.locator('#about').evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return { top: Math.round(rect.top), bottom: Math.round(rect.bottom) };
      });
    const scrollTo = (y: number) =>
      page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);

    await scrollTo(railTop);
    await page.waitForTimeout(400);
    const arrived = await frame();
    // Taken here, where the handover has not started, so the section is still
    // at its natural size.
    const copyAtRest = await copyBox();

    // Held to within a pixel: `svh` units round differently at fractional
    // scroll offsets. Unpinned the section would travel the full scroll delta,
    // hundreds of pixels, so a pixel of slack still tells the two apart.
    const expectHeld = async () => {
      const now = await frame();
      expect(Math.abs(now.top - arrived.top)).toBeLessThanOrEqual(1);
      expect(Math.abs(now.bottom - arrived.bottom)).toBeLessThanOrEqual(1);
    };

    await scrollTo(railTop + viewport.height * 0.5);
    await page.waitForTimeout(400);
    await expectHeld();

    await scrollTo(railTop + viewport.height * 0.9);
    await page.waitForTimeout(400);
    await expectHeld();

    // Held, and the copy wholly on screen. The section is ~828px unpinned, so
    // pinning it with its own padding would strand the last paragraph below the
    // fold on a 768px viewport with no way left to scroll to it.
    expect(copyAtRest.top).toBeGreaterThanOrEqual(0);
    expect(copyAtRest.bottom).toBeLessThanOrEqual(viewport.height);
  });
}

test('the about copy drops its blur once the sweep has landed', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const geometry = await page
    .getByTestId('hero-split-rail')
    .evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return { top: window.scrollY + bounds.top, height: bounds.height };
    });
  await page.evaluate(
    (target) => window.scrollTo({ top: target, behavior: 'instant' }),
    geometry.top + geometry.height,
  );

  // `blur(0px)` is still a filter, and leaving it on holds every character on
  // the filtered rasterization path. The handover straight after this scales
  // the whole block, so those few hundred spans would be re-rastered every
  // frame: measured at 69 frames per two seconds with the filter left on
  // against 119 once it is cleared, and twelve frames over 32ms against none.
  await page.waitForFunction(
    () => {
      const lead = document.querySelector('[data-testid="about-lead"]');
      if (!lead) return false;
      const characters = [...lead.querySelectorAll('span span')];
      return (
        characters.length > 20 &&
        characters.every(
          (character) => getComputedStyle(character).filter === 'none',
        )
      );
    },
    undefined,
    { timeout: 15000 },
  );
});

test('the stack surface covers the hanging badge during the handover', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();
  await expect(page.getByTestId('hero-about-transition')).toHaveAttribute(
    'data-transition-ready',
    'true',
    { timeout: 4000 },
  );

  // Park in the hold and let the badge finish arriving. This is not politeness:
  // the badge animates its own opacity on entrance, so measuring before it has
  // landed reads ~0 and the assertion below passes without testing anything.
  await page.getByTestId('about-pin-rail').evaluate((element) => {
    window.scrollTo({
      top: element.getBoundingClientRect().top + window.scrollY,
      behavior: 'instant',
    });
  });
  await expect(page.locator('#about')).toHaveAttribute(
    'data-body-revealed',
    'true',
    { timeout: 8000 },
  );
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const card = document.querySelector<HTMLElement>(
            '[data-testid="about-badge"] div[style*="transform-origin"]',
          );
          let opacity = 1;
          let layer: HTMLElement | null = card;
          while (layer && layer !== document.body) {
            opacity *= Number.parseFloat(getComputedStyle(layer).opacity);
            layer = layer.parentElement;
          }
          return opacity;
        }),
      { timeout: 8000, message: 'badge never became visible to begin with' },
    )
    .toBeGreaterThan(0.9);

  const result = await page.evaluate(async () => {
    const rail = document.querySelector<HTMLElement>(
      '[data-testid="about-pin-rail"]',
    );
    const card = document.querySelector<HTMLElement>(
      '[data-testid="about-badge"] div[style*="transform-origin"]',
    );
    const stack = document.querySelector<HTMLElement>(
      '[data-testid="stack-scene-panel"]',
    );
    if (!rail || !card || !stack) {
      return { found: false, owner: 'missing', badgeOpacity: 1, fraction: 0 };
    }

    const railTop = rail.getBoundingClientRect().top + window.scrollY;
    const travel = rail.scrollHeight - window.innerHeight;

    for (let fraction = 0.4; fraction <= 0.95; fraction += 0.01) {
      window.scrollTo({
        top: railTop + travel * fraction,
        behavior: 'instant',
      });
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );

      const cardRect = card.getBoundingClientRect();
      const stackRect = stack.getBoundingClientRect();
      // The moment the rising edge first reaches the card at all. Waiting for a
      // wide overlap would step over exactly the frames being guarded here:
      // the stub is at its most visible the instant the edge bites in.
      if (stackRect.top > cardRect.bottom) continue;

      let badgeOpacity = 1;
      let layer: HTMLElement | null = card;
      while (layer && layer !== document.body) {
        badgeOpacity *= Number.parseFloat(getComputedStyle(layer).opacity);
        layer = layer.parentElement;
      }

      const x = cardRect.left + cardRect.width / 2;
      const y = Math.min(stackRect.top + 8, window.innerHeight - 1);
      const hit = document.elementFromPoint(x, y);

      return {
        found: true,
        owner: hit?.closest('[data-testid="stack-scene-panel"]')
          ? 'stack'
          : 'badge',
        badgeOpacity,
        fraction: Number(fraction.toFixed(2)),
      };
    }

    return { found: false, owner: 'none', badgeOpacity: 1, fraction: 0 };
  });

  expect(result.found).toBe(true);
  expect(result.owner).toBe('stack');
  expect(result.badgeOpacity).toBeLessThanOrEqual(0.05);
});

test('the hanging badge follows a drag and never widens the page', async ({
  page,
}) => {
  // The badge renders from `lg` up, so 1024 is its tightest column — the worst
  // case for a swing escaping the section.
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto('/');

  const transition = page.getByTestId('hero-about-transition');
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();
  await expect(transition).toHaveAttribute('data-transition-ready', 'true', {
    timeout: 4000,
  });

  // Park where the about is locked to the viewport, so the badge is fully in
  // frame and the physics loop is running.
  await page.getByTestId('about-pin-rail').evaluate((element) => {
    window.scrollTo({
      top: element.getBoundingClientRect().top + window.scrollY,
      behavior: 'instant',
    });
  });

  const card = page
    .getByTestId('about-badge')
    .locator('div[style*="transform-origin"]');
  await expect(card).toBeVisible();
  // The physics loop is parked by an IntersectionObserver, and Playwright's
  // "visible" does not mean "in the viewport" — so scroll it into frame or the
  // badge will sit inert and the drag below will hit nothing.
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500);

  const angle = () =>
    card.evaluate((element) => {
      const match = /rotate\((-?[\d.]+)rad\)/.exec(
        (element as HTMLElement).style.transform,
      );
      return match ? Number.parseFloat(match[1]) : 0;
    });

  const box = await card.boundingBox();
  if (!box) throw new Error('the badge card has no box');
  const resting = await card.evaluate(
    (element) => element.getBoundingClientRect().left,
  );

  // The card is dragged across the body copy, so its fill has to be opaque —
  // a translucent one let the paragraphs read straight through it. Chrome only
  // reports `rgba(...)` when the alpha is below 1.
  const fill = await card.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
  expect(fill).toMatch(/^rgb\(/);

  // Drag as far left as the pointer can reach, and hold it there.
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(2, box.y + box.height / 2 - 120, { steps: 18 });
  await page.waitForTimeout(400);

  const swung = await angle();
  const left = await card.evaluate(
    (element) => element.getBoundingClientRect().left,
  );
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  // Dragged over the copy it has to occlude it. Sticky opens a stacking context
  // at `z-index: auto`, and the Motion filter on the paragraphs paints them as
  // if positioned at 0 — so without the sidebar's `lg:z-10` they paint on top
  // and read straight through the card.
  // Now swing it the other way, over the body copy, which is the case that
  // matters: the card has to hide the text rather than let it read through.
  await page.mouse.move(box.x + box.width / 2 + 260, box.y + box.height / 2, {
    steps: 18,
  });
  await page.waitForTimeout(400);

  // Probed at the avatar rather than the card. The card rotates about its top
  // edge, so once it has swung the centre of its bounding box is no longer a
  // point on the card; the avatar is a circle, so its bounding-box centre
  // always is.
  const onTop = await page
    .getByTestId('about-badge-face')
    .evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const hit = document.elementFromPoint(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
      );
      return hit?.closest('[data-testid="about-badge"]') ? 'badge' : 'copy';
    });
  await page.mouse.up();
  expect(onTop).toBe('badge');

  // It follows the pointer right out to the side. An earlier build clamped the
  // angle to 0.4rad, which made the badge stop tracking and read as stuck.
  expect(Math.abs(swung)).toBeGreaterThan(0.6);
  expect(left).toBeLessThan(resting - 80);
  // `main`'s `overflow-clip` takes the far end of the swing. Whatever the
  // pointer does, the page must never grow sideways.
  expect(overflow).toBe(0);

  // Released, it keeps swinging but every pass is smaller than the last.
  await page.waitForTimeout(5000);
  expect(Math.abs(await angle())).toBeLessThan(Math.abs(swung));
});

test('the About badge loads the configured portrait', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const portrait = page.getByTestId('about-badge-face').locator('img');
  await expect(portrait).toHaveCount(1);
  expect(
    await portrait.evaluate((image) => {
      const portraitImage = image as HTMLImageElement;
      return portraitImage.complete && portraitImage.naturalWidth > 0;
    }),
  ).toBe(true);
});

test('the About badge uses a tall card silhouette around the large portrait', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const card = page
    .getByTestId('about-badge')
    .locator('div[style*="transform-origin"]');
  const face = page.getByTestId('about-badge-face');
  const dimensions = await Promise.all([
    card.evaluate((element) => element.getBoundingClientRect().width),
    face.evaluate((element) => element.getBoundingClientRect().width),
  ]);

  expect(dimensions[0]).toBeGreaterThanOrEqual(232);
  expect(dimensions[0]).toBeLessThanOrEqual(240);
  expect(dimensions[1]).toBeGreaterThanOrEqual(160);
});

test('the About badge rests close to the copy without overlapping it', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const gap = await page.evaluate(() => {
    const card = document.querySelector<HTMLElement>(
      '[data-testid="about-badge"] div[style*="transform-origin"]',
    );
    const copy = document.querySelector<HTMLElement>(
      '[data-testid="about-copy"]',
    );
    if (!card || !copy) return null;

    return copy.getBoundingClientRect().left - card.getBoundingClientRect().right;
  });

  expect(gap).not.toBeNull();
  expect(gap!).toBeGreaterThanOrEqual(24);
  expect(gap!).toBeLessThanOrEqual(72);
});

for (const viewport of [
  { name: 'laptop', width: 1440, height: 900 },
  { name: 'short laptop', width: 1280, height: 768 },
]) {
  test(`${viewport.name} never slices the badge when it is pulled downwards`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(
      page.getByRole('status', { name: /loading portfolio/i }),
    ).toBeHidden();
    await expect(page.getByTestId('hero-about-transition')).toHaveAttribute(
      'data-transition-ready',
      'true',
      { timeout: 4000 },
    );

    await page.getByTestId('about-pin-rail').evaluate((element) => {
      window.scrollTo({
        top: element.getBoundingClientRect().top + window.scrollY,
        behavior: 'instant',
      });
    });

    const card = page
      .getByTestId('about-badge')
      .locator('div[style*="transform-origin"]');
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(2500);

    const box = await card.boundingBox();
    if (!box) throw new Error('the badge card has no box');

    // Straight down and hard, so the cord stretches into its elastic range and
    // the card travels past the about section's own box.
    await page.mouse.move(box.x + box.width / 2, box.y + 20);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y + 20 + 520, {
      steps: 24,
    });
    await page.waitForTimeout(500);

    // The section used to carry `overflow-hidden`, which cut 81px off the
    // bottom of the card here and read as a band of background laid across it.
    // Probing the card's own lower edge is what catches that: a clip leaves the
    // geometry untouched and only changes what is painted.
    const bottomEdge = await card.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const hit = document.elementFromPoint(
        rect.left + rect.width / 2,
        rect.bottom - 4,
      );
      return {
        onCard: Boolean(hit?.closest('[data-testid="about-badge"]')),
        withinViewport: rect.bottom <= window.innerHeight,
      };
    });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    await page.mouse.up();

    // Guards the probe itself: past the fold the frame clips at the screen
    // edge, which is legitimate, and the assertion below would be vacuous.
    expect(bottomEdge.withinViewport).toBe(true);
    expect(bottomEdge.onCard).toBe(true);
    expect(overflow).toBe(0);
  });
}

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
  await expect(
    page.getByRole('article', { name: 'Sabor & Mesa' }),
  ).toHaveAttribute('aria-current', 'true');
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

for (const viewport of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'short desktop', width: 1024, height: 768 },
]) {
  test(`${viewport.name} centres the project the reader has reached`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    /*
      The scene is swapped once, not styled: the server renders the stacked
      branch and the media query replaces that whole subtree after hydration.
      Reaching for anything inside it before then resolves a node that is about
      to be thrown away, and the action fails on a detached element rather than
      on what it was testing. The loader covers exactly that window.
    */
    await expect(
      page.getByRole('status', { name: /loading portfolio/i }),
    ).toBeHidden();

    await expect(page.getByTestId('project-marker')).toHaveCount(4);
    await expect(page.getByTestId('project-slab')).toHaveCount(4);

    const stage = page.getByTestId('desktop-project-stage');
    await stage.scrollIntoViewIfNeeded();
    const geometry = await stage.evaluate((element) => ({
      top: window.scrollY + element.getBoundingClientRect().top,
      step: window.innerHeight,
    }));

    for (const index of [0, 1, 3]) {
      await page.evaluate(
        (target) => window.scrollTo({ top: target, behavior: 'instant' }),
        geometry.top + geometry.step * index,
      );
      /*
        Polled until it settles rather than read once after a fixed beat.

        The handoff between stack and projects is carried by a spring, and the
        jump above is a teleport of several thousand pixels that no reader ever
        makes — measured on the built bundle it slides in over roughly two and a
        half seconds, so a single reading at 220ms caught the panel still on its
        way and called it a defect. What is being asserted is where the stage
        comes to rest, so that is what this waits for.
      */
      await expect
        .poll(
          () =>
            page.evaluate(() => {
              const slabs = [
                ...document.querySelectorAll('[data-testid="project-slab"]'),
              ];
              // The slab that is centred is the one whose own box has not been
              // pushed off along the diagonal.
              return slabs.findIndex((slab) => {
                const box = slab.getBoundingClientRect();
                return Math.abs(box.left) < 4 && Math.abs(box.top) < 4;
              });
            }),
          { timeout: 6000 },
        )
        .toBe(index);
    }

    // Nothing in the text layer may scroll inside itself: an inner scroller
    // swallows the wheel and traps the reader inside a snap target.
    const trapped = await page.evaluate(() =>
      [...document.querySelectorAll('[data-testid$="-rail"]')].some(
        (rail) =>
          rail.scrollHeight > rail.clientHeight + 1 &&
          getComputedStyle(rail).overflowY === 'auto',
      ),
    );
    expect(trapped).toBe(false);
  });
}

test('the slabs cross without either turning transparent', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();

  const stage = page.getByTestId('desktop-project-stage');
  await stage.scrollIntoViewIfNeeded();
  const geometry = await stage.evaluate((element) => ({
    top: window.scrollY + element.getBoundingClientRect().top,
    step: window.innerHeight,
  }));

  // The crossing is the whole effect, so the slabs do overlap — the guarantee
  // is that neither is see-through while they do. This section has produced
  // that artefact twice: sections reading through each other, then two cards
  // legible at once. Opacity is never animated here, and this is what says so.
  for (const fraction of [0, 0.25, 0.5, 0.75, 1, 1.5, 2]) {
    await page.evaluate(
      (target) => window.scrollTo({ top: target, behavior: 'instant' }),
      geometry.top + geometry.step * fraction,
    );
    await page.waitForTimeout(140);

    const faded = await page.evaluate(() =>
      [...document.querySelectorAll('[data-testid="project-slab"]')]
        .map((slab) => Number(getComputedStyle(slab).opacity))
        .filter((opacity) => opacity < 1),
    );
    expect(faded).toEqual([]);
  }
});

/*
  Two heights that used to draw the line, not one arbitrary size.

  The amount of rail left below the last project is a fraction that changes with
  the height of the window, so a single viewport proves nothing: the original
  defect was invisible at 1440x900 and at 1920x927, and plain at 1920x915. These
  two are the worst of a sweep from 900 to 960 taken against the built bundle,
  where the line showed at ten of twenty one heights.
*/
for (const viewport of [
  { name: 'tall desktop', width: 1920, height: 915 },
  { name: 'taller desktop', width: 1920, height: 924 },
]) {
  test(`${viewport.name} ends the projects rail without the contact ground showing beneath it`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(
      page.getByRole('status', { name: /loading portfolio/i }),
    ).toBeHidden();

    await page.getByTestId('desktop-project-stage').scrollIntoViewIfNeeded();

    /**
     * Measured at every stop, resting, which is the only place a reader ever
     * sees this. The contact section is cream and the stage is near black, so
     * a fraction of it under the foot of the rail is not a subtle defect: it
     * reads as a pale line ruled across the bottom of the screen.
     */
    const worst = await page.evaluate(async () => {
      const markers = [
        ...document.querySelectorAll('[data-testid="project-marker"]'),
      ];
      const contact = document.getElementById('contact');
      if (!contact) return { gap: -1, at: -1 };

      let gap = Infinity;
      let at = -1;
      for (let index = 0; index < markers.length; index += 1) {
        window.scrollTo({
          top: window.scrollY + markers[index].getBoundingClientRect().top,
          behavior: 'instant',
        });
        await new Promise((settle) => setTimeout(settle, 900));
        const showing =
          contact.getBoundingClientRect().top - window.innerHeight;
        if (showing < gap) {
          gap = showing;
          at = index;
        }
      }
      return { gap, at };
    });

    expect(worst.gap, `contact showing at stop ${worst.at}`).toBeGreaterThan(0);
  });
}

test('the wheel commands the stage instead of scrolling it', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();

  const stage = page.getByTestId('desktop-project-stage');
  await stage.scrollIntoViewIfNeeded();
  const top = await stage.evaluate(
    (element) => window.scrollY + element.getBoundingClientRect().top,
  );
  await page.evaluate(
    (target) => window.scrollTo({ top: target, behavior: 'instant' }),
    top,
  );
  await page.waitForTimeout(900);

  // Count what actually reaches the page. Anything swallowed in the capture
  // phase never arrives here.
  await page.evaluate(() => {
    const store = window as unknown as { __wheels?: number };
    store.__wheels = 0;
    window.addEventListener(
      'wheel',
      () => {
        store.__wheels = (store.__wheels ?? 0) + 1;
      },
      { passive: true },
    );
  });

  await page.mouse.move(720, 450);
  await page.mouse.wheel(0, 100);
  await page.waitForTimeout(300);
  // Shoved hard, mid-flight, on top of the notch that started it.
  await page.mouse.wheel(0, 1500);
  await page.waitForTimeout(150);

  // Not one of them reaches the page, the triggering notch included.
  //
  // Letting that first one through was the defect. Lenis would scroll it and
  // ease itself to a halt, and the snap would then start again from rest —
  // measured, the page ran at 10px a frame, fell to 1px for two frames, then
  // climbed back, which reads as the animation catching and restarting. The
  // wheel commands the stage here; it never moves it.
  const during = await page.evaluate(
    () => (window as unknown as { __wheels?: number }).__wheels ?? 0,
  );
  expect(during).toBe(0);

  await page.waitForTimeout(2200);
  const travelled = await page.evaluate(
    (from) => Math.round(window.scrollY - from),
    top,
  );
  expect(Math.abs(travelled - 900)).toBeLessThanOrEqual(1);

  // Off the end it has to let go, or the section is a trap: a reader who
  // reaches the last project must be able to scroll out of it.
  await page.evaluate(
    (target) => window.scrollTo({ top: target, behavior: 'instant' }),
    top + 900 * 3,
  );
  await page.waitForTimeout(900);
  const beforeLeaving = await page.evaluate(
    () => (window as unknown as { __wheels?: number }).__wheels ?? 0,
  );
  await page.mouse.wheel(0, 200);
  await page.waitForTimeout(400);
  expect(
    await page.evaluate(
      () => (window as unknown as { __wheels?: number }).__wheels ?? 0,
    ),
  ).toBeGreaterThan(beforeLeaving);
});

test('the project frame answers the pointer and settles again', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();

  const stage = page.getByTestId('desktop-project-stage');
  await stage.scrollIntoViewIfNeeded();
  // Parked on the first stop, or the first project's frame is still parked off
  // the corner and the pointer would land on empty stage.
  const top = await stage.evaluate(
    (element) => window.scrollY + element.getBoundingClientRect().top,
  );
  await page.evaluate(
    (target) => window.scrollTo({ top: target, behavior: 'instant' }),
    top,
  );
  await page.waitForTimeout(900);

  const frame = page.getByTestId('project-slab-frame').first();
  const box = (await frame.boundingBox())!;
  const transform = () =>
    frame.evaluate((element) => getComputedStyle(element).transform);

  expect(await transform()).toBe('none');
  await page.mouse.move(box.x + box.width * 0.15, box.y + box.height * 0.2);
  await page.waitForTimeout(500);
  // A real 3D transform, not a flat one: the tilt is the whole point.
  expect((await transform()).startsWith('matrix3d(')).toBe(true);
  await page.mouse.move(10, 10);
  await page.waitForTimeout(700);
  expect(await transform()).toBe('none');
});

test('the stage takes its colour from the project on show', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();

  const stage = page.getByTestId('desktop-project-stage');
  await stage.scrollIntoViewIfNeeded();
  const top = await stage.evaluate(
    (element) => window.scrollY + element.getBoundingClientRect().top,
  );

  const step = await page.evaluate(() => window.innerHeight);
  const washes: string[] = [];
  for (const index of [0, 1, 2, 3]) {
    await page.evaluate(
      (target) => window.scrollTo({ top: target, behavior: 'instant' }),
      top + step * index,
    );
    await page.waitForTimeout(700);
    washes.push(
      await page.evaluate(
        () =>
          getComputedStyle(
            document.querySelector('[data-testid="project-stage-wash"]')!,
          ).backgroundImage,
      ),
    );
  }

  // Four projects, four different washes, and every one of them faint. Laid on
  // at any strength that reads as a colour they would fight the monochrome the
  // rest of the site is built on.
  expect(new Set(washes).size).toBe(4);
  for (const wash of washes) {
    expect(wash).toContain('oklab');
    expect(wash).toContain('0.16');
  }
});

test('crossing the projects stays at frame rate', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();

  const stage = page.getByTestId('desktop-project-stage');
  await stage.scrollIntoViewIfNeeded();
  const top = await stage.evaluate(
    (element) => window.scrollY + element.getBoundingClientRect().top,
  );

  // The about→stack handover once dropped to 69 frames per two seconds because
  // a lingering `filter` sat under an ancestor that animated. This stage moves
  // four full-viewport layers at once, so it is the obvious place for that to
  // happen again — nothing here may animate anything but `transform`.
  const crossing = async () =>
    page.evaluate(async (start: number) => {
      const frames: number[] = [];
      let last = performance.now();
      const began = last;
      await new Promise<void>((done) => {
        const tick = (now: number) => {
          frames.push(now - last);
          last = now;
          const through = Math.min(1, (now - began) / 2000);
          window.scrollTo({
            top: start + window.innerHeight * 3 * through,
            behavior: 'instant',
          });
          if (through < 1) requestAnimationFrame(tick);
          else done();
        };
        requestAnimationFrame(tick);
      });
      const settled = frames.slice(2).sort((a, b) => a - b);
      return {
        frames: settled.length,
        p90: settled[Math.floor(settled.length * 0.9)],
        janky: settled.filter((frame) => frame > 32).length,
      };
    }, top);

  // Two passes, because the two costs are different and only one of them is a
  // defect. The first traversal pays once to rasterise four viewport-sized
  // layers and decode the screenshots — measured at two dropped frames, both
  // inside the first 150ms. What has to stay clean is everything after.
  const first = await crossing();
  await page.evaluate(
    (target) => window.scrollTo({ top: target, behavior: 'instant' }),
    top,
  );
  await page.waitForTimeout(700);
  const settled = await crossing();

  // Judged on the ninetieth percentile rather than on a count of dropped
  // frames. Counting was too brittle to survive the suite's own six workers
  // fighting for the CPU, and it did not need to be that tight to be useful:
  // this measures 16.8ms clean, while the regression it exists to catch — a
  // `filter` left under an animating ancestor — measured 83ms. Forty sits with
  // a wide margin either side of anything that matters.
  expect(settled.p90).toBeLessThan(40);
  expect(first.p90).toBeLessThan(40);
  expect(settled.frames).toBeGreaterThan(90);
});

test('one wheel gesture turns exactly one project, in either direction', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();
  await expect(page.getByTestId('stack-projects-scene')).toBeAttached();

  const first = page.getByTestId('project-marker').first();
  await page.getByTestId('desktop-project-stage').scrollIntoViewIfNeeded();
  const geometry = await first.evaluate((marker) => ({
    top: window.scrollY + marker.getBoundingClientRect().top,
    height: marker.getBoundingClientRect().height,
  }));

  await page.evaluate(
    (target) => window.scrollTo({ top: target, behavior: 'instant' }),
    geometry.top,
  );
  await page.waitForTimeout(700);

  // Real wheel events, not a programmatic scroll: Lenis snapping is driven by
  // virtual scroll input, so `window.scrollTo` would never engage it.
  await page.mouse.move(720, 450);
  const travelled = async () =>
    page.evaluate((from) => Math.round(window.scrollY - from), geometry.top);
  const panel = Math.round(geometry.height);
  const expectTravelled = async (expected: number) => {
    expect(Math.abs((await travelled()) - expected)).toBeLessThanOrEqual(1);
  };

  /**
   * Waits for the page to stop moving rather than sleeping for a fixed spell.
   * The animation runs about 1.2s, and a fixed wait long enough for that on an
   * idle machine is not long enough when the suite runs six workers at once —
   * this test flaked exactly that way.
   */
  const settle = async () => {
    await page.evaluate(() => {
      delete (window as unknown as Record<string, unknown>).__settleAt;
      delete (window as unknown as Record<string, unknown>).__settleFor;
    });
    await page.waitForFunction(
      () => {
        const store = window as unknown as {
          __settleAt?: number;
          __settleFor?: number;
        };
        const position = Math.round(window.scrollY);
        if (store.__settleAt === position)
          store.__settleFor = (store.__settleFor ?? 0) + 1;
        else {
          store.__settleAt = position;
          store.__settleFor = 0;
        }
        return (store.__settleFor ?? 0) >= 6;
      },
      undefined,
      { polling: 60, timeout: 15000 },
    );
  };

  // The property that separates this from settling on the nearest panel: a
  // single notch, a small fraction of a screen, still turns a whole one. Left
  // to settle on proximity this would fall back to where it started.
  await page.mouse.wheel(0, 100);
  await settle();
  await expectTravelled(panel);
  // The second project is the one on stage now, not merely a panel in view.
  const centred = await page.evaluate(() =>
    [...document.querySelectorAll('[data-testid="project-slab"]')].findIndex(
      (slab) => Math.abs(slab.getBoundingClientRect().left) < 4,
    ),
  );
  expect(centred).toBe(1);

  // An ordinary wheel spin is a burst of notches, and the burst must not stack
  // up into several pages: input during a running snap is ignored.
  //
  // Dispatched back to back rather than spaced by a timer. A spaced burst is a
  // truer imitation of a real wheel, but `waitForTimeout` is a floor, not a
  // duration — with the suite running six workers those 30ms gaps stretched
  // until the first snap finished mid-burst and the rest legitimately began a
  // second one. The property under test is that a fast burst is one gesture,
  // and firing them together is the only way to keep the burst fast.
  for (let notch = 0; notch < 6; notch += 1) {
    await page.mouse.wheel(0, 120);
  }
  await settle();
  await expectTravelled(panel * 2);

  // And back, one at a time.
  await page.mouse.wheel(0, -100);
  await settle();
  await expectTravelled(panel);
});

test('the project snap leaves the rest of the page alone', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();
  await expect(page.getByTestId('stack-projects-scene')).toBeAttached();

  // Parked in the stack inventory, a long way above the projects. Snapping is
  // registered on the project panels only, so an ordinary wheel gesture here
  // must remain ordinary page movement.
  const grid = page.getByTestId('stack-grid');
  await grid.scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    const element = document.querySelector('[data-testid="stack-grid"]')!;
    const bounds = element.getBoundingClientRect();
    window.scrollTo({
      top: window.scrollY + bounds.top + bounds.height * 0.25,
      behavior: 'instant',
    });
  });
  await page.waitForTimeout(700);

  const before = await page.evaluate(() => Math.round(window.scrollY));
  await page.mouse.move(720, 450);
  await page.mouse.wheel(0, 120);
  await page.waitForTimeout(1800);
  const after = await page.evaluate(() => Math.round(window.scrollY));

  // It may coast with the wheel, but it must not be flung a whole screen away
  // to the nearest project.
  expect(after - before).toBeGreaterThan(0);
  expect(after - before).toBeLessThan(900);
});

test('entering the projects from the stack remains free scrolling', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();
  await expect(page.getByTestId('stack-projects-scene')).toBeAttached();

  const stage = page.getByTestId('desktop-project-stage');
  await stage.scrollIntoViewIfNeeded();
  const stageTop = await stage.evaluate(
    (element) => window.scrollY + element.getBoundingClientRect().top,
  );
  const startingGap = 450;
  await page.evaluate(
    (target) => window.scrollTo({ top: target, behavior: 'instant' }),
    stageTop - startingGap,
  );
  await page.waitForTimeout(700);

  const before = await page.evaluate(() => window.scrollY);
  await page.mouse.move(720, 450);
  await page.mouse.wheel(0, 120);
  await page.waitForTimeout(1800);
  const after = await page.evaluate(() => window.scrollY);

  expect(after - before).toBeGreaterThan(0);
  expect(after - before).toBeLessThan(startingGap * 0.7);
});

test('arrival momentum pauses on the first project before a new gesture advances', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();
  await expect(page.getByTestId('stack-projects-scene')).toBeAttached();

  const first = page.getByTestId('project-marker').first();
  const geometry = await first.evaluate((marker) => ({
    top: window.scrollY + marker.getBoundingClientRect().top,
    height: marker.getBoundingClientRect().height,
  }));

  // Begin outside the project-owned viewport. A strong trackpad gesture can
  // carry a Lenis target beyond the first stop before project snapping owns
  // the screen; that arrival must be consumed as the entrance, not mistaken
  // for a command to reveal project two.
  await page.evaluate(
    (target) => window.scrollTo({ top: target, behavior: 'instant' }),
    geometry.top - 350,
  );
  await page.waitForTimeout(700);
  await page.mouse.move(720, 450);
  await page.mouse.wheel(0, 1000);

  const settle = async () => {
    await page.evaluate(() => {
      delete (window as unknown as Record<string, unknown>).__arrivalAt;
      delete (window as unknown as Record<string, unknown>).__arrivalFor;
    });
    await page.waitForFunction(
      () => {
        const store = window as unknown as {
          __arrivalAt?: number;
          __arrivalFor?: number;
        };
        const position = Math.round(window.scrollY);
        if (store.__arrivalAt === position)
          store.__arrivalFor = (store.__arrivalFor ?? 0) + 1;
        else {
          store.__arrivalAt = position;
          store.__arrivalFor = 0;
        }
        return (store.__arrivalFor ?? 0) >= 6;
      },
      undefined,
      { polling: 60, timeout: 15000 },
    );
  };

  await settle();
  expect(
    Math.abs((await page.evaluate(() => window.scrollY)) - geometry.top),
  ).toBeLessThanOrEqual(1);
  // The section's horizontal handoff has its own spring, so the page can be
  // parked before the painted panel has covered its final few pixels.
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          [
            ...document.querySelectorAll('[data-testid="project-slab"]'),
          ].findIndex(
            (slab) => Math.abs(slab.getBoundingClientRect().left) < 4,
          ),
        ),
      { timeout: 4000 },
    )
    .toBe(0);

  // The pause protects only the arrival. The next intentional gesture must
  // retain the existing one-project-per-gesture behaviour.
  await page.mouse.wheel(0, 100);
  await settle();
  expect(
    Math.abs(
      (await page.evaluate(() => window.scrollY)) -
        (geometry.top + geometry.height),
    ),
  ).toBeLessThanOrEqual(1);
});

test('stack and projects cross one shared viewport before project snapping begins', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();

  const handoffStart = await page
    .getByTestId('stack-projects-handoff-start')
    .evaluate((element) =>
      Math.round(element.getBoundingClientRect().top + window.scrollY),
    );

  const park = async (top: number) => {
    await page.evaluate(
      (target) => window.scrollTo({ top: target, behavior: 'instant' }),
      top,
    );
    await page.waitForTimeout(700);
  };
  const positions = () =>
    page.evaluate(() => {
      const stack = document
        .querySelector<HTMLElement>('[data-testid="stack-scene-panel"]')!
        .getBoundingClientRect();
      const projects = document
        .querySelector<HTMLElement>('[data-testid="projects-scene-panel"]')!
        .getBoundingClientRect();
      return {
        stackLeft: Math.round(stack.left),
        stackRight: Math.round(stack.right),
        projectsLeft: Math.round(projects.left),
      };
    });

  await park(handoffStart);
  await expect.poll(async () => (await positions()).stackLeft).toBe(0);
  await expect.poll(async () => (await positions()).projectsLeft).toBe(1440);

  await park(handoffStart + 450);
  const crossing = await positions();
  expect(crossing.stackLeft).toBeLessThan(0);
  expect(crossing.projectsLeft).toBeGreaterThan(0);
  expect(crossing.stackRight).toBeGreaterThanOrEqual(crossing.projectsLeft);

  const beforeWheel = await page.evaluate(() => window.scrollY);
  await page.mouse.move(720, 450);
  await page.mouse.wheel(0, 120);
  await page.waitForTimeout(1800);
  const wheelTravel = await page.evaluate(
    (before) => Math.round(window.scrollY - before),
    beforeWheel,
  );
  expect(wheelTravel).toBeGreaterThan(0);
  expect(wheelTravel).toBeLessThan(450);

  await park(handoffStart + 900);
  await expect
    .poll(async () => (await positions()).stackLeft, { timeout: 4000 })
    .toBeLessThanOrEqual(-1440);
  await expect
    .poll(async () => (await positions()).projectsLeft, { timeout: 4000 })
    .toBe(0);
});

test('stack and projects remain edge to edge throughout their shared handoff', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();

  const scene = page.getByTestId('stack-projects-scene');
  const handoff = page.getByTestId('stack-projects-handoff-start');
  const stackPanel = page.getByTestId('stack-scene-panel');
  const projectsPanel = page.getByTestId('projects-scene-panel');

  await expect(scene).toBeAttached();
  await expect(stackPanel).toBeAttached();
  await expect(projectsPanel).toBeAttached();

  const handoffTop = await handoff.evaluate(
    (element) => element.getBoundingClientRect().top + window.scrollY,
  );
  const viewportHeight = page.viewportSize()!.height;

  for (const fraction of [0, 0.25, 0.5, 0.75, 1]) {
    await page.evaluate(
      (top) => window.scrollTo({ top, behavior: 'instant' }),
      handoffTop + viewportHeight * fraction,
    );
    await page.waitForTimeout(500);

    const edges = await page.evaluate(() => {
      const stack = document
        .querySelector<HTMLElement>('[data-testid="stack-scene-panel"]')!
        .getBoundingClientRect();
      const projects = document
        .querySelector<HTMLElement>('[data-testid="projects-scene-panel"]')!
        .getBoundingClientRect();

      return {
        stackWidth: Math.round(stack.width),
        projectsWidth: Math.round(projects.width),
        seam: Math.abs(stack.right - projects.left),
      };
    });

    expect(edges.stackWidth).toBe(1440);
    expect(edges.projectsWidth).toBe(1440);
    expect(edges.seam).toBeLessThanOrEqual(2);
  }
});

test('the stack keeps its direct scroll response before the shared handoff', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();

  const scene = page.getByTestId('stack-projects-scene');
  const stack = page.getByTestId('stack-scene-panel').locator('section');
  const sceneTop = await scene.evaluate(
    (element) => element.getBoundingClientRect().top + window.scrollY,
  );

  await page.evaluate(
    (top) => window.scrollTo({ top, behavior: 'instant' }),
    sceneTop,
  );
  await page.waitForTimeout(500);
  const before = await stack.evaluate(
    (element) => element.getBoundingClientRect().top,
  );

  await page.evaluate(async (top) => {
    window.scrollTo({ top, behavior: 'instant' });
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
  }, sceneTop + 240);
  const after = await stack.evaluate(
    (element) => element.getBoundingClientRect().top,
  );

  expect(Math.abs(before - after - 240)).toBeLessThanOrEqual(4);
});

test('the arc cover hides the jump between sections', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();

  // Sampled on rAF inside the page. The whole claim is about what individual
  // frames show, and no assertion driven from the test runner can see those.
  await page.evaluate(() => {
    const trace: { y: number; edge: number | null }[] = [];
    (window as Window & { __arcTrace?: typeof trace }).__arcTrace = trace;
    const tick = () => {
      const cover = document.querySelector('[data-testid="arc-reveal"] path');
      const d = cover?.getAttribute('d') ?? '';
      // The first y in the path is the cover's leading edge, as a fraction of
      // the screen: 1.1 is off the bottom, 0 is covering it.
      const match = /^M 0 (-?[\d.]+)/.exec(d);
      trace.push({
        y: Math.round(window.scrollY),
        edge: match ? Number(match[1]) : null,
      });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  const origin = await page.evaluate(() => Math.round(window.scrollY));
  await page
    .getByRole('navigation', { name: /primary navigation/i })
    .getByRole('link', { name: 'Projects' })
    .click();
  await expect(page.getByTestId('arc-reveal')).toBeVisible();
  await expect(page.getByTestId('arc-reveal')).toHaveCount(0, {
    timeout: 8000,
  });

  const trace = await page.evaluate(
    () =>
      (window as Window & { __arcTrace?: { y: number; edge: number | null }[] })
        .__arcTrace ?? [],
  );
  const destination = trace[trace.length - 1].y;
  expect(destination).not.toBe(origin);

  // It really swept, rather than appearing already closed.
  const midSweep = trace.filter(
    (f) => f.edge !== null && f.edge > 0.05 && f.edge < 1.05,
  );
  expect(midSweep.length).toBeGreaterThan(10);

  // The point of the whole thing: the page may only move once it cannot be
  // seen. Any frame showing the destination while the cover is still short of
  // the top edge is the journey leaking through.
  const leaked = trace.filter(
    (f) => f.y === destination && f.edge !== null && f.edge > 0,
  );
  expect(leaked).toEqual([]);
});

test('the stack settles on its last screen and leaves sideways', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();

  const geometry = await page.evaluate(() => {
    const rail = document.querySelector<HTMLElement>(
      '[data-testid="stack-slide-rail"]',
    );
    const handoff = document.querySelector<HTMLElement>(
      '[data-testid="stack-projects-handoff-start"]',
    );
    const stack = document.querySelector<HTMLElement>(
      '[data-testid="stack-scene-panel"] section',
    );
    if (!rail || !handoff || !stack) return null;
    return {
      railTop: rail.getBoundingClientRect().top + window.scrollY,
      handoffTop: handoff.getBoundingClientRect().top + window.scrollY,
    };
  });
  expect(geometry).not.toBeNull();
  const { railTop, handoffTop } = geometry!;
  const handoffStart = handoffTop - railTop;
  expect(handoffStart).toBeGreaterThan(0);
  const park = (offset: number) =>
    page.evaluate(async (top) => {
      window.scrollTo({ top, behavior: 'instant' });
      await new Promise((resolve) => setTimeout(resolve, 280));
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    }, Math.round(offset));
  /**
   * The content itself travels vertically until its last composition is framed;
   * the full-screen panel is what remains held while the shared strip leaves.
   */
  const box = () =>
    page.evaluate(() => {
      const panel = document.querySelector<HTMLElement>(
        '[data-testid="stack-scene-panel"]',
      )!;
      const stack = panel.querySelector<HTMLElement>('section')!;
      const panelRect = panel.getBoundingClientRect();
      const stackRect = stack.getBoundingClientRect();
      return {
        left: Math.round(panelRect.left),
        panelTop: Math.round(panelRect.top),
        stackTop: Math.round(stackRect.top),
      };
    });

  // Well before the handoff: still travelling up under its own steam.
  await park(handoffTop - 400);
  await expect
    .poll(async () => (await box()).left, { timeout: 4000 })
    .toBe(0);
  const approaching = await box();
  expect(approaching.stackTop).toBeGreaterThan(-handoffStart + 100);
  expect(approaching.left).toBe(0);

  await park(handoffTop);
  const locked = await box();
  expect(Math.abs(locked.stackTop + handoffStart)).toBeLessThanOrEqual(2);
  expect(locked.panelTop).toBe(0);

  await park(handoffTop + 450);
  const halfway = await box();
  expect(Math.abs(halfway.stackTop + handoffStart)).toBeLessThanOrEqual(2);
  expect(halfway.panelTop).toBe(0);
  // Leaving sideways.
  expect(halfway.left).toBeLessThan(-100);

  await park(handoffTop + 900);
  // Polled rather than read once: the slide runs through a spring, so after a
  // jump straight to the end it is still easing in when the scroll settles.
  await expect
    .poll(async () => (await box()).left, { timeout: 4000 })
    .toBeLessThanOrEqual(-1440);

  // Held throughout: the content never moves up while any of this happens.
  const settled = await box();
  expect(Math.abs(settled.stackTop + handoffStart)).toBeLessThanOrEqual(2);
  expect(settled.panelTop).toBe(0);
});

test('the reverse handoff restores the stack before its vertical ascent resumes', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();

  const geometry = await page.evaluate(() => {
    const rail = document.querySelector<HTMLElement>(
      '[data-testid="stack-slide-rail"]',
    );
    const handoff = document.querySelector<HTMLElement>(
      '[data-testid="stack-projects-handoff-start"]',
    );
    if (!rail || !handoff) return null;

    const railTop = rail.getBoundingClientRect().top + window.scrollY;
    const handoffTop = handoff.getBoundingClientRect().top + window.scrollY;
    return {
      handoffStart: handoffTop - railTop,
      handoffTop,
      viewportHeight: window.innerHeight,
    };
  });
  expect(geometry).not.toBeNull();

  // Begin with Projects fully owning the viewport and wait for the established
  // forward spring to finish. The defect only exists on the return journey.
  await page.evaluate(
    (top) => window.scrollTo({ top, behavior: 'instant' }),
    // Start on project two so this reverse-transition test is independent of
    // the short first-project arrival hold tested above.
    geometry!.handoffTop + geometry!.viewportHeight * 2,
  );
  await expect
    .poll(
      () =>
        page
          .getByTestId('stack-scene-panel')
          .evaluate((element) => Math.round(element.getBoundingClientRect().left)),
      { timeout: 5000 },
    )
    .toBeLessThanOrEqual(-1440);

  const frames = await page.evaluate(async (target) => {
    const panel = document.querySelector<HTMLElement>(
      '[data-testid="stack-scene-panel"]',
    )!;
    const stack = panel.querySelector<HTMLElement>('section')!;
    const samples: { left: number; stackTop: number }[] = [];

    window.scrollTo({ top: target, behavior: 'instant' });
    for (let frame = 0; frame < 45; frame += 1) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      samples.push({
        left: panel.getBoundingClientRect().left,
        stackTop: stack.getBoundingClientRect().top,
      });
    }
    return samples;
  }, geometry!.handoffTop - 240);

  // While any of the horizontal exit remains, Stack must stay parked on its
  // final vertical composition. Otherwise both axes move together and the
  // reader sees it climbing before it has actually returned to the screen.
  const prematureAscent = frames.filter(
    (frame) =>
      frame.left < -4 &&
      frame.stackTop > -geometry!.handoffStart + 4,
  );
  expect(prematureAscent).toEqual([]);

  // Once fully restored, the exact 240px upward movement is still the direct
  // Stack response — no new inertia or vertical lock was introduced.
  const settled = frames.at(-1)!;
  expect(Math.abs(settled.left)).toBeLessThanOrEqual(2);
  expect(
    Math.abs(settled.stackTop - (-geometry!.handoffStart + 240)),
  ).toBeLessThanOrEqual(4);
});

test('the navbar names the section actually on screen', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();

  const nav = page.getByRole('navigation', { name: /primary navigation/i });
  // From the projects, so the sweep crosses both handovers on the way up.
  // Upwards out of the first project the snap has no target, so this is
  // ordinary free scroll rather than a gesture-per-project.
  await nav.getByRole('link', { name: 'Projects' }).click();
  await expect(page.getByTestId('arc-reveal')).toHaveCount(0, {
    timeout: 8000,
  });

  /**
   * Wheeled, not jumped.
   *
   * A jump hands the observer every intersection change at once, and the wrong
   * implementation happens to land on the right answer from that. The fault
   * only shows under continuous scrolling, where the changes arrive one at a
   * time and a single entry decides.
   */
  const sample = () =>
    page.evaluate(() => {
      /**
       * Which section is painting a given height of the screen.
       *
       * Asked as `closest('section[id]')` this answered `null` for the whole
       * length of the stack and the projects: the scene that lays those two out
       * carries their ids on absolutely positioned markers, so the content they
       * paint is not inside the element holding the id. Every reading over both
       * sections was therefore dropped as unknown, and the test went on passing
       * while the navbar named neither of them.
       */
      const owner = (y: number) => {
        const hit = document.elementFromPoint(window.innerWidth / 2, y);
        const panel = hit?.closest<HTMLElement>(
          'section[id], [data-testid="stack-scene-panel"], [data-testid="projects-scene-panel"]',
        );
        if (!panel) return null;
        if (panel.dataset.testid === 'stack-scene-panel') return 'stack';
        if (panel.dataset.testid === 'projects-scene-panel') return 'projects';
        return panel.id || null;
      };

      const top = owner(window.innerHeight * 0.35);
      const bottom = owner(window.innerHeight * 0.45);
      return {
        at: Math.round(window.scrollY),
        onScreen: top,
        /**
         * Both sections are genuinely on screen while one is handing over to
         * the other, and the band the navbar reads spans exactly that overlap —
         * so either answer is right there, and only there.
         */
        contested: top !== bottom,
        named:
          document
            .querySelector(
              'nav[aria-label="Primary navigation"] a[aria-current="page"]',
            )
            ?.getAttribute('href')
            ?.slice(1) ?? null,
      };
    });

  const readings: Awaited<ReturnType<typeof sample>>[] = [];
  for (let step = 0; step < 14; step += 1) {
    await page.mouse.wheel(0, -170);
    await page.waitForTimeout(220);
    readings.push(await sample());
  }

  expect(readings.length).toBeGreaterThan(5);

  // The sweep has to actually reach the sections that broke, or this passes on
  // a page where the navbar never names them at all — which is how it passed
  // while the selection sat on the about for the length of both.
  const named = new Set(readings.map((reading) => reading.onScreen));
  expect(named.has('stack')).toBe(true);
  expect(named.has('projects')).toBe(true);

  /**
   * The selection has to agree with what is painted. A pinned section keeps its
   * box in the middle of the screen for the whole length of its rail, so asking
   * the section itself lit the about while the stack was covering it.
   */
  const disagreements = readings.filter(
    (reading) =>
      !reading.contested &&
      reading.onScreen !== null &&
      reading.named !== reading.onScreen,
  );
  expect(disagreements).toEqual([]);
});

test('clicking the section already on screen does not play the cover', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();

  const nav = page.getByRole('navigation', { name: /primary navigation/i });
  await nav.getByRole('link', { name: 'Projects' }).click();
  await expect(page.getByTestId('arc-reveal')).toHaveCount(0, {
    timeout: 8000,
  });
  await expect(nav.locator('a[aria-current="page"]')).toHaveAttribute(
    'href',
    '#projects',
  );

  // Already there: two and a half seconds of cover over a page that barely
  // moves is theatre, so the click falls through to the plain anchor.
  let coverSeen = false;
  const watch = setInterval(() => {
    page
      .evaluate(() =>
        Boolean(document.querySelector('[data-testid="arc-reveal"]')),
      )
      .then((seen) => {
        coverSeen ||= seen;
      })
      .catch(() => undefined);
  }, 60);

  await nav.getByRole('link', { name: 'Projects' }).click();
  await page.waitForTimeout(1600);
  clearInterval(watch);

  expect(coverSeen).toBe(false);
});

/**
 * The monogram is the one stop on the bar that is not a section, and it was the
 * one that still jumped. The way home crosses the projects' rail and the
 * stack's handover — the two things the cover exists to hide — so it gets the
 * same cover, and names where it is going rather than showing the initials
 * again at display size.
 */
/**
 * The mark behind each contact card has to travel, not appear.
 *
 * Tailwind v4 writes `scale-125` to the `scale` property rather than into the
 * `transform` shorthand, so a transition that lists `transform` interpolates
 * nothing: measured, the watermark read its full 1.25 on the first frame and
 * only the fade ever animated. That is invisible to a test that checks the
 * start and the end, which is why this one samples the middle.
 */
test('the mark behind a contact card grows into place rather than appearing', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();

  await page.evaluate(async () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
    await new Promise((resolve) => setTimeout(resolve, 1200));
  });

  const centred = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('[data-testid="contact-card"]')];
    let nearest: Element | null = null;
    let best = Number.POSITIVE_INFINITY;
    for (const card of cards) {
      const box = card.getBoundingClientRect();
      const distance = Math.abs(box.left + box.width / 2 - window.innerWidth / 2);
      if (distance < best) {
        best = distance;
        nearest = card;
      }
    }
    if (!nearest) return null;
    nearest.id = 'hover-probe';
    const box = nearest.getBoundingClientRect();
    return [
      Math.round(box.left + box.width / 2),
      Math.round(box.top + box.height / 2),
    ] as const;
  });
  expect(centred).not.toBeNull();

  await page.mouse.move(10, 10);
  await page.waitForTimeout(500);
  await page.mouse.move(centred![0], centred![1]);

  const readings = await page.evaluate(async () => {
    const card = document.getElementById('hover-probe');
    const mark = card?.querySelector<HTMLElement>(
      'svg[class*="size-36"], span[class*="text-[7rem]"]',
    );
    const samples: number[] = [];
    for (let step = 0; step < 10; step += 1) {
      const scale = mark ? getComputedStyle(mark).scale : 'none';
      samples.push(scale === 'none' ? 1 : Number.parseFloat(scale));
      await new Promise((resolve) => setTimeout(resolve, 70));
    }
    return samples;
  });

  // It ends up enlarged...
  expect(readings.at(-1)).toBeGreaterThan(1.2);
  // ...and was caught on the way there, at a size it only holds mid-travel.
  const inFlight = readings.filter((scale) => scale > 1.01 && scale < 1.24);
  expect(inFlight.length).toBeGreaterThan(1);
});

/**
 * The language control changes the page, not just its own tick.
 *
 * Asserted through the document's own `lang` and through copy from three
 * different places — the bar, a section heading and the contact line — because
 * the failure this guards against is a half-translated page: one dictionary
 * wired up and another left behind, which reads as a bug rather than as a
 * language.
 */
test('choosing a language rewrites the site and is remembered', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();

  /*
    Scoped by test id rather than by the navigation's accessible name, because
    that name is itself translated: written as `{ name: /primary navigation/i }`
    the locator stopped matching the moment the switch worked, and the test
    failed for the one reason that means it is passing.
  */
  const nav = page.getByTestId('navbar-shell');
  await expect(nav.getByRole('link', { name: 'About' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.lang)).toBe('en');

  // The bar carries one for each breakpoint; at this width only one is shown.
  await page.locator('[data-testid="language-switch"]:visible').click();
  await page.locator('[data-testid="language-option-pt"]:visible').click();

  await expect(nav.getByRole('link', { name: 'Sobre' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Projetos' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.lang)).toBe('pt-BR');

  await page.keyboard.press('Escape');
  await page.evaluate(async () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
    await new Promise((resolve) => setTimeout(resolve, 1200));
  });
  await expect(
    page.getByRole('heading', { name: /tem um projeto em mente/i }),
  ).toBeVisible();

  /*
    The choice outlives the visit.

    Polled rather than read once. Waiting on the Portuguese loader to hide
    looks like a wait and is not one: before the page hydrates that status does
    not exist under any name, `toBeHidden` is satisfied by an element that is
    absent, and the read underneath it lands while `lang` still holds the `en`
    the server sent. The test passed on about two runs in three, and the third
    reported the wrong thing, since a language that is remembered and a page
    that has not woken up yet are indistinguishable at that instant.
  */
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.lang))
    .toBe('pt-BR');
  await expect(nav.getByRole('link', { name: 'Sobre' })).toBeVisible();
});

/**
 * The accounts belong to the composition above them, not to the bottom edge.
 *
 * "Do they fit on the last screen" was the only thing checked for a long time,
 * and it kept passing while the cards sat pressed against the bottom: the text
 * block took `flex-1`, swallowed every spare pixel and pushed them down, so on
 * a 1376px tablet they ended at 1257 with the email stranded hundreds of pixels
 * above. Still inside the viewport, and still invisible to anyone whose browser
 * chrome takes a bite out of it.
 *
 * So the measure is the balance, not the fit: the gap above the cards has to be
 * no larger than the room left below them. Pinned to the bottom that inverts,
 * which is the shape of the bug.
 */
test('the contact cards sit with the address, not on the bottom edge', async ({
  page,
}) => {
  for (const viewport of [
    { width: 1032, height: 1376 },
    { width: 1376, height: 1032 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(
      page.getByRole('status', { name: /loading portfolio/i }),
    ).toBeHidden();

    await page.evaluate(async () => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
      await new Promise((resolve) => setTimeout(resolve, 1200));
    });

    const layout = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('[data-testid="contact-card"]')];
      const address = document.querySelector('#contact a[href^="mailto:"]');
      if (!address || cards.length === 0) return null;
      const boxes = cards.map((card) => card.getBoundingClientRect());
      const top = Math.min(...boxes.map((box) => box.top));
      const bottom = Math.max(...boxes.map((box) => box.bottom));
      return {
        total: cards.length,
        onScreen: boxes.filter((box) => box.width > 0 && box.top >= -1 && box.bottom <= window.innerHeight + 1).length,
        gapAbove: Math.round(top - address.getBoundingClientRect().bottom),
        roomBelow: Math.round(window.innerHeight - bottom),
      };
    });

    expect(layout).not.toBeNull();
    expect(layout!.total).toBeGreaterThanOrEqual(5);
    expect(layout!.onScreen).toBe(layout!.total);
    expect(layout!.gapAbove).toBeLessThanOrEqual(layout!.roomBelow);
  }
});

/**
 * The badge arrives with the split, not on a switch.
 *
 * It used to share the body copy's boolean gate, so it appeared and vanished in
 * one step. The card is not a line of text: it hangs off a cord that reaches
 * above the section's own top edge, deliberately unclipped, so while the split
 * is still running it is the one element that can be drawn across the seam.
 *
 * Walked down the rail rather than sampled at two points, and sequentially
 * rather than in parallel. Both matter: the progress is scroll-linked, so
 * jumping to a position and reading it immediately catches the value before it
 * has settled, and overlapping scrolls simply fight each other.
 */
test('the about badge fades with the split rather than switching on', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 900 });
  await page.goto('/');
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();

  const rail = await page.evaluate(() => {
    const element = document.querySelector('[data-testid="hero-split-rail"]');
    if (!element) return null;
    const box = element.getBoundingClientRect();
    return { top: box.top + window.scrollY, height: box.height };
  });
  expect(rail).not.toBeNull();

  const fades: number[] = [];
  for (let step = 0; step <= 12; step += 1) {
    const progress = step / 12;
    await page.evaluate(async (top) => {
      window.scrollTo({ top, behavior: 'instant' });
      await new Promise((resolve) => setTimeout(resolve, 380));
    }, Math.round(rail!.top + rail!.height * progress));

    const fade = await page.evaluate(() => {
      const layer = document.querySelector<HTMLElement>('[data-testid="about-badge-exit"]');
      return layer ? Number(getComputedStyle(layer).opacity) : 1;
    });
    fades.push(fade);
  }

  // Absent while the panels are still on their way, and there by the time the
  // copy has landed.
  expect(fades[0]).toBeLessThan(0.05);
  expect(fades.at(-3)!).toBeGreaterThan(0.95);

  /**
   * And caught partway, which is what separates a fade from a switch: a boolean
   * gate is never anywhere other than 0 or 1.
   */
  const partway = fades.filter((value) => value > 0.05 && value < 0.95);
  expect(partway.length).toBeGreaterThan(0);
});

test('the monogram covers the way home and names it', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();

  const nav = page.getByRole('navigation', { name: /primary navigation/i });
  const home = nav.getByRole('link', { name: /back to top/i });

  // Already at the top: no journey to hide, so the click falls through to the
  // plain anchor, exactly as it does for a section already on screen.
  let coverSeen = false;
  const watch = setInterval(() => {
    page
      .evaluate(() =>
        Boolean(document.querySelector('[data-testid="arc-reveal"]')),
      )
      .then((seen) => {
        coverSeen ||= seen;
      })
      .catch(() => undefined);
  }, 60);

  await home.click();
  await page.waitForTimeout(1600);
  clearInterval(watch);
  expect(coverSeen).toBe(false);

  await nav.getByRole('link', { name: 'Stack' }).click();
  await expect(page.getByTestId('arc-reveal')).toHaveCount(0, {
    timeout: 8000,
  });
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);

  // The bar slid away on the way down; reaching for it brings it back.
  await page.mouse.wheel(0, -40);
  await page.waitForTimeout(600);

  await home.click();
  await expect(page.getByTestId('arc-reveal-label')).toHaveText('Home');
  await expect(page.getByTestId('arc-reveal')).toHaveCount(0, {
    timeout: 8000,
  });
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test('the navbar selection sits on the monogram at the hero, and comes back to it', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();

  const nav = page.getByRole('navigation', { name: /primary navigation/i });
  const home = nav.getByRole('link', { name: /back to top/i });
  const selectedHome = () =>
    home.evaluate((element) =>
      Boolean(element.querySelector('span[class*="bg-paper"]')),
    );

  // At the top the reader is in no section, so the selection belongs to the
  // monogram rather than to whichever link happens to be first.
  expect(await selectedHome()).toBe(true);
  await expect(nav.locator('a[aria-current="page"]')).toHaveCount(0);

  for (let i = 0; i < 8; i += 1) {
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(800);
  expect(await selectedHome()).toBe(false);
  await expect(nav.locator('a[aria-current="page"]')).toHaveCount(1);

  /**
   * And back. This is the half that was broken: the observer reports a section
   * leaving the band while it is still partway up the screen and then says
   * nothing more, so the bar went on claiming the reader was in a section they
   * had scrolled clear of.
   */
  for (let i = 0; i < 16; i += 1) {
    await page.mouse.wheel(0, -300);
    await page.waitForTimeout(100);
  }
  await page.waitForTimeout(900);
  expect(await selectedHome()).toBe(true);
  await expect(nav.locator('a[aria-current="page"]')).toHaveCount(0);
});

test('the navbar gets out of the way going down and returns going up', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();

  const shell = page.getByTestId('navbar-shell');
  const placement = () =>
    shell.evaluate((element) => ({
      top: Math.round(element.getBoundingClientRect().top),
      opacity: Number(getComputedStyle(element).opacity),
    }));

  const height = await shell.evaluate(
    (element) => element.getBoundingClientRect().height,
  );
  expect((await placement()).top).toBe(0);

  // A short nudge, still near the top: the bar holds its place, or the first
  // scroll of a visit would flick it away and straight back.
  await page.mouse.wheel(0, 60);
  await page.waitForTimeout(700);
  expect((await placement()).top).toBe(0);

  for (let i = 0; i < 5; i += 1) {
    await page.mouse.wheel(0, 260);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(700);
  const away = await placement();
  // Fully clear of the top edge, not merely nudged.
  expect(away.top).toBeLessThanOrEqual(-height);
  expect(away.opacity).toBeLessThan(0.05);

  await page.mouse.wheel(0, -200);
  await page.waitForTimeout(700);
  const back = await placement();
  expect(back.top).toBe(0);
  expect(back.opacity).toBe(1);
});

test('a section transition does not read as a scroll gesture', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();

  // The cover moves the page thousands of pixels in a single frame. Counted as
  // a gesture that is the hardest scroll down the reader never made, and the
  // bar would be gone the moment the cover cleared.
  await page
    .getByRole('navigation', { name: /primary navigation/i })
    .getByRole('link', { name: 'Contact' })
    .click();
  await expect(page.getByTestId('arc-reveal')).toHaveCount(0, {
    timeout: 8000,
  });
  await page.waitForTimeout(600);

  const shell = page.getByTestId('navbar-shell');
  expect(
    await shell.evaluate((element) =>
      Math.round(element.getBoundingClientRect().top),
    ),
  ).toBe(0);
  await expect(shell).toHaveCSS('opacity', '1');
});

test('a pinned section is still reachable from further down the page', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();

  const nav = page.getByRole('navigation', { name: /primary navigation/i });
  await nav.getByRole('link', { name: 'Stack' }).click();
  await expect(page.getByTestId('arc-reveal')).toHaveCount(0, {
    timeout: 8000,
  });
  const fromStack = await page.evaluate(() => Math.round(window.scrollY));

  await nav.getByRole('link', { name: 'About' }).click();
  await expect(page.getByTestId('arc-reveal')).toHaveCount(0, {
    timeout: 8000,
  });
  const atAbout = await page.evaluate(() => Math.round(window.scrollY));

  /**
   * The about is held in a sticky frame, so asking the section itself where it
   * is returns where it is *stuck* — from here that is roughly the reader's own
   * position, and the transition used to play out in full and go nowhere.
   */
  expect(fromStack - atAbout).toBeGreaterThan(800);

  // And it is genuinely framed, not merely somewhere above.
  const statement = page.getByTestId('about-statement');
  await expect(statement).toBeInViewport();
});

test('reduced motion navigates without the cover', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  const origin = await page.evaluate(() => Math.round(window.scrollY));
  await page
    .getByRole('navigation', { name: /primary navigation/i })
    .getByRole('link', { name: 'Contact' })
    .click();
  await page.waitForTimeout(600);

  // No cover, and the anchor still did its job — the transition must not have
  // swallowed the click and left these readers unable to navigate.
  await expect(page.getByTestId('arc-reveal')).toHaveCount(0);
  expect(await page.evaluate(() => Math.round(window.scrollY))).toBeGreaterThan(
    origin,
  );
});

test('reduced motion keeps the desktop project arrival fixed and correctly anchored', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  /**
   * Wait for the stage to be the one this test means.
   *
   * The server renders the stacked branch, where this element sits inside a
   * plain `hidden` wrapper and measures nothing at all; the desktop branch
   * replaces it after hydration and puts it in `hidden lg:block`. Read in the
   * gap between the two, the anchor and the first marker came back 4598px
   * apart, which is not a defect but two elements from different trees being
   * compared. Visibility is the difference between them, so it is what this
   * waits on.
   */
  await expect(page.getByTestId('desktop-project-stage')).toBeVisible();

  /**
   * And then wait for it to stop moving.
   *
   * Visibility is the swap, not the settling: measured at the instant the stage
   * appears it sat 112px below where it comes to rest, because the section
   * above it is still reflowing. Polling asks the question the test is actually
   * asking, which is where these two end up, rather than catching them in
   * transit and calling the difference a defect.
   */
  await expect
    .poll(() =>
      page.evaluate(() => {
        const anchor = document.querySelector('#projects [data-scroll-anchor]');
        const marker = document.querySelector(
          '[data-testid="project-marker"]',
        );
        if (!anchor || !marker) return Number.POSITIVE_INFINITY;
        const top = (element: Element) =>
          Math.round(element.getBoundingClientRect().top + window.scrollY);
        return Math.abs(top(anchor) - top(marker));
      }),
    )
    .toBeLessThanOrEqual(1);

  const geometry = await page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>(
      '[data-testid="desktop-project-stage"]',
    );
    const anchor = document.querySelector<HTMLElement>(
      '#projects [data-scroll-anchor]',
    );
    const firstMarker = document.querySelector<HTMLElement>(
      '[data-testid="project-marker"]',
    );
    if (!stage || !anchor || !firstMarker) return null;

    const absoluteTop = (element: HTMLElement) =>
      Math.round(element.getBoundingClientRect().top + window.scrollY);
    return {
      stageTop: absoluteTop(stage),
      anchorTop: absoluteTop(anchor),
      markerTop: absoluteTop(firstMarker),
    };
  });
  expect(geometry).not.toBeNull();
  expect(
    Math.abs(geometry!.anchorTop - geometry!.markerTop),
  ).toBeLessThanOrEqual(1);

  const projectLeftAt = async (top: number) => {
    await page.evaluate(
      (target) => window.scrollTo({ top: target, behavior: 'instant' }),
      top,
    );
    await page.waitForTimeout(350);
    return page
      .getByTestId('project-diagonal-stage')
      .evaluate((element) => Math.round(element.getBoundingClientRect().left));
  };

  expect(await projectLeftAt(geometry!.stageTop)).toBe(0);
  expect(await projectLeftAt(geometry!.stageTop + 450)).toBe(0);
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
  // The About heading is deliberately `sr-only` now, so assert on the copy the
  // section actually draws — a visibility check on the heading would pass on a
  // 1px offscreen box and prove nothing.
  await expect(page.getByTestId('about-statement')).toBeVisible();
  await expect(page.getByTestId('about-lead')).toBeVisible();
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

test('the stack grid reveals every group once it is scrolled into view', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();

  const grid = page.getByTestId('stack-grid');
  await grid.scrollIntoViewIfNeeded();

  // Counted from the content rather than written down, so adding or removing a
  // band is a content edit and not also a test edit.
  const bands = page.getByTestId('stack-group');
  await expect(bands).toHaveCount(portfolioContent.stackGroups.length);

  // The rails above are `aria-hidden` decoration; this panel is the only
  // structured account of the stack, so it has to actually arrive. Its hidden
  // state is 8% opacity, which a `toBeVisible` check would happily pass.
  for (const band of await bands.all()) {
    await band.scrollIntoViewIfNeeded();
    const items = band.getByRole('listitem');
    await expect(items.first()).toHaveCSS('opacity', '1');
    await expect(items.last()).toHaveCSS('opacity', '1');
  }
});

test('hovering a tool opens a panel explaining it, and every mark stays visible', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();

  const react = page
    .getByTestId('stack-tool')
    .filter({ hasText: 'React' })
    .first();
  await react.scrollIntoViewIfNeeded();

  await expect(page.getByTestId('stack-tool-panel')).toHaveCount(0);
  await react.hover();

  const panel = page.getByTestId('stack-tool-panel');
  await expect(panel).toBeVisible();
  await expect(panel).toHaveCSS('opacity', '1');
  // Anchored on behaviour, not on the wording: the panel names the tool and
  // says something beyond its name. Pinning a phrase here only made the suite
  // break every time the copy was edited, which is not a defect worth a test.
  await expect(panel).toContainText('React');
  const reactBody = await panel.locator('p').innerText();
  expect(reactBody.length).toBeGreaterThan(20);

  // Moving away closes it, so a swept row does not leave panels behind.
  await page.getByRole('heading', { name: 'Stack & tools' }).hover();
  await expect(panel).toHaveCount(0);

  // A second tool must say something else, or the panel is not per-tool. Done
  // after the close above on purpose: the outgoing popup stays mounted for its
  // exit animation, so hovering straight across leaves two in the DOM at once.
  await page
    .getByTestId('stack-tool')
    .filter({ hasText: 'PostgreSQL' })
    .first()
    .hover();
  await expect(panel).toContainText('PostgreSQL');
  expect(await panel.locator('p').innerText()).not.toBe(reactBody);

  /*
    Four of the marks ship as pure or near black, which disappears on the dark
    ground this page is mostly made of.

    Judged against the ground each mark is actually drawn on, not against the
    page as a whole. A blanket "nothing may be near black" was true while every
    mark sat on the ink, and became wrong the day the contact cards arrived:
    those sit on cream, where near black is the readable choice and the rule
    would have demanded the invisible one.
  */
  const invisible = await page.getByTestId('stack-icon').evaluateAll((icons) => {
    /*
      The first ancestor that actually paints something solid.

      Translucent fills are skipped rather than read: the contact tile is black
      at 6%, and taken at face value it reads as pure black while what the eye
      sees is the cream underneath it. Whatever is behind a wash is what the
      mark is really judged against.
    */
    const opaqueGround = (start: Element) => {
      for (
        let node: Element | null = start;
        node;
        node = node.parentElement
      ) {
        const painted = getComputedStyle(node).backgroundColor;
        const alpha = painted.includes('/')
          ? Number(painted.split('/').pop()?.replace(')', '') ?? '1')
          : Number((painted.match(/[\d.]+/g) ?? [])[3] ?? '1');
        if (alpha === 1) return painted;
      }
      return '';
    };

    return icons
      .map((icon) => ({ fill: icon.getAttribute('fill') ?? '', ground: opaqueGround(icon) }))
      .filter(({ fill, ground }) => {
        const channels = [1, 3, 5].map((at) =>
          Number.parseInt(fill.slice(at, at + 2), 16),
        );
        if (!channels.every((channel) => channel < 0x30)) return false;
        // A ground with no light in it is one this mark cannot be seen on.
        const groundChannels = (ground.match(/\d+/g) ?? []).slice(0, 3);
        return (
          groundChannels.length === 3 &&
          groundChannels.every((channel) => Number(channel) < 0x60)
        );
      });
  });
  expect(invisible).toEqual([]);
});

test('scroll reveals re-arm when a block leaves the viewport and comes back', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(
    page.getByRole('status', { name: /loading portfolio/i }),
  ).toBeHidden();

  // Two different code paths on purpose: the stack panel drives `revealItem`
  // through its own stagger container, while the contact heading goes through
  // the shared `RevealText` primitive. Both hang off `scrollRevealViewport`.
  const stackItem = page.locator('[data-testid="stack-group"] li').first();
  const contactLine = page
    .getByRole('heading', { name: /have a project in mind.*make it real/i })
    .locator('span')
    .first();

  /**
   * Put the stack back in its own column before scrolling to anything inside
   * it.
   *
   * Once the section has slid out of the way it sits a full screen to the left,
   * and `scrollIntoViewIfNeeded` aims at where an element *is* — so it would
   * scroll to a place where the item is still off the side and never coming
   * back. Its rail is never transformed, so that is what gets aimed at.
   */
  const resetToStack = () =>
    page.evaluate(() => {
      const rail = document.querySelector('[data-testid="stack-slide-rail"]');
      if (!rail) return;
      window.scrollTo({
        top: rail.getBoundingClientRect().top + window.scrollY,
        behavior: 'instant',
      });
    });

  const settledOpacity = async (target: typeof stackItem, viaStack = false) => {
    if (viaStack) await resetToStack();
    await target.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1800);
    return target.evaluate((element) => getComputedStyle(element).opacity);
  };

  expect(await settledOpacity(stackItem, true)).toBe('1');

  // Away, far enough that no part of the stack panel is on screen — that is
  // what `amount: "some"` waits for before re-arming.
  expect(await settledOpacity(contactLine)).toBe('1');
  const rearmed = await stackItem.evaluate(
    (element) => getComputedStyle(element).opacity,
  );

  // And back. If the gate were `once: true` this would still read 1 above,
  // which is exactly the static behaviour being replaced.
  expect(Number.parseFloat(rearmed)).toBeLessThan(1);
  expect(await settledOpacity(stackItem, true)).toBe('1');
});

for (const viewport of [
  { name: 'laptop', width: 1440, height: 900 },
  { name: 'short laptop', width: 1024, height: 768 },
  { name: 'phone', width: 390, height: 844 },
]) {
  test(`${viewport.name} keeps the stack inventory in the natural page flow`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(
      page.getByRole('status', { name: /loading portfolio/i }),
    ).toBeHidden();

    const grid = page.getByTestId('stack-grid');
    await grid.scrollIntoViewIfNeeded();

    await expect(page.getByTestId('stack-pin-rail')).toHaveCount(0);
    await expect(page.getByTestId('stack-pin-frame')).toHaveCount(0);

    const before = await grid.evaluate((element) =>
      Math.round(element.getBoundingClientRect().top),
    );
    await page.evaluate(() =>
      window.scrollBy({ top: 260, behavior: 'instant' }),
    );
    await page.waitForTimeout(500);
    const after = await grid.evaluate((element) =>
      Math.round(element.getBoundingClientRect().top),
    );

    expect(before - after).toBeGreaterThan(120);

    const lastBand = page.getByTestId('stack-group').last();
    await lastBand.scrollIntoViewIfNeeded();
    await expect(lastBand).toBeInViewport({ ratio: 0.8 });
    await page
      .getByRole('heading', { name: 'Selected work' })
      .scrollIntoViewIfNeeded();
    await expect(
      page.getByRole('heading', { name: 'Selected work' }),
    ).toBeVisible();
  });
}

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
