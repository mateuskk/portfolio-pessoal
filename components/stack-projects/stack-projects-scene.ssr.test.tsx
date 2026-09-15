import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { portfolioContent } from '@/content/portfolio';
import { StackProjectsScene } from './stack-projects-scene';

describe('StackProjectsScene hydration', () => {
  it('uses the server branch for the first desktop client render', () => {
    const browserWindow = window;
    const originalMatchMedia = browserWindow.matchMedia;
    const scene = () => (
      <StackProjectsScene
        groups={portfolioContent.stackGroups}
        items={portfolioContent.stack}
        projects={portfolioContent.projects}
      />
    );

    Reflect.deleteProperty(globalThis, 'window');
    const serverMarkup = renderToString(scene());

    Object.defineProperty(browserWindow, 'matchMedia', {
      configurable: true,
      value: (query: string) => ({
        matches: query === '(min-width: 1024px)',
      }),
    });
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: browserWindow,
    });

    try {
      const firstDesktopClientMarkup = renderToString(scene());

      // Hydration compares these first two trees before effects are allowed to
      // select the responsive desktop scene. If they differ, React discards
      // the server-rendered Stack + Projects subtree and shows its dev overlay.
      expect(firstDesktopClientMarkup).toBe(serverMarkup);
    } finally {
      Object.defineProperty(browserWindow, 'matchMedia', {
        configurable: true,
        value: originalMatchMedia,
      });
    }
  });
});
