import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { completeIntro, startIntro } from '@/lib/intro';
import { HeroAboutTransition, isHeroSplitReady } from './hero-about-transition';

const content = {
  person: {
    name: 'Seu Nome',
    role: 'Creative Developer',
    location: 'São Paulo, BR',
    availability: 'Available for selected projects',
  },
  about: {
    statement: 'Clarity and character, built together.',
    paragraphs: ['First biography paragraph.', 'Second biography paragraph.'],
  },
};

describe('HeroAboutTransition', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    startIntro();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('keeps the split-screen dormant until the complete hero presentation is ready', () => {
    expect(
      isHeroSplitReady({
        introReady: false,
        visualReady: true,
        entranceSettled: true,
        reduceMotion: false,
      }),
    ).toBe(false);
    expect(
      isHeroSplitReady({
        introReady: true,
        visualReady: false,
        entranceSettled: true,
        reduceMotion: false,
      }),
    ).toBe(false);
    expect(
      isHeroSplitReady({
        introReady: true,
        visualReady: true,
        entranceSettled: false,
        reduceMotion: false,
      }),
    ).toBe(false);
    expect(
      isHeroSplitReady({
        introReady: true,
        visualReady: true,
        entranceSettled: true,
        reduceMotion: false,
      }),
    ).toBe(true);
  });

  it('avoids trapping reduced-motion visitors behind the animated readiness gate', () => {
    expect(
      isHeroSplitReady({
        introReady: false,
        visualReady: false,
        entranceSettled: false,
        reduceMotion: true,
      }),
    ).toBe(true);
  });

  it('places the existing hero and about content around a two-panel center split', () => {
    render(
      <HeroAboutTransition person={content.person} about={content.about} />,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: /creative.*developer/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'About me' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('hero-split-panel-top')).toBeInTheDocument();
    expect(screen.getByTestId('hero-split-panel-bottom')).toBeInTheDocument();
  });

  it('activates scrolling only after the loader, visual, and hero entrance have settled', async () => {
    render(
      <HeroAboutTransition person={content.person} about={content.about} />,
    );

    const transition = screen.getByTestId('hero-about-transition');
    expect(transition).toHaveAttribute('data-transition-ready', 'false');

    act(() => completeIntro());
    await act(async () => vi.advanceTimersByTimeAsync(1600));
    expect(transition).toHaveAttribute('data-transition-ready', 'false');

    await act(async () => vi.advanceTimersByTimeAsync(200));
    expect(transition).toHaveAttribute('data-transition-ready', 'true');
  });
});
