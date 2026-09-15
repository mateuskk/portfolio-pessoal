import { act, render, screen } from '@testing-library/react';
import { motionValue } from 'motion/react';
import { describe, expect, it } from 'vitest';

import { AboutSection } from './about-section';

const baseContent = {
  name: 'Seu Nome',
  initials: 'SN',
  role: 'FullStack Developer',
  statement:
    "I'm a _FullStack Developer_ focused on building **clean systems**.",
  paragraphs: ['First biography paragraph.', 'Second biography paragraph.'],
  portrait: null,
};

describe('AboutSection', () => {
  it('presents the heading, statement, and hanging badge', () => {
    render(<AboutSection content={baseContent} />);

    expect(screen.getByRole('region', { name: 'About' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /about/i })).toBeInTheDocument();
    expect(screen.getByTestId('about-lead')).toHaveTextContent(
      'First biography paragraph.',
    );
    expect(screen.getByTestId('about-badge')).toHaveTextContent('Seu Nome');
  });

  it('keeps the inline emphasis intact through the per-character reveal', () => {
    render(<AboutSection content={baseContent} />);

    const statement = screen.getByTestId('about-statement');
    expect(statement.querySelector('em')).toHaveTextContent(
      'FullStack Developer',
    );
    expect(statement.querySelector('strong')).toHaveTextContent(
      'clean systems',
    );
    expect(statement).toHaveTextContent(
      "I'm a FullStack Developer focused on building clean systems.",
    );
  });

  it('opens the statement from its centre and keeps biography copy blurred', () => {
    render(<AboutSection content={baseContent} />);

    expect(screen.getByTestId('about-statement')).toHaveAttribute(
      'data-animation',
      'center-fold-reveal',
    );
    expect(screen.getByTestId('about-lead')).toHaveAttribute(
      'data-animation',
      'blur-reveal',
    );
  });

  it('emphasises body italics by weight, and headline italics by face', () => {
    render(
      <AboutSection
        content={{
          ...baseContent,
          paragraphs: ['I care about _design_ and **engineering**.'],
        }}
      />,
    );

    // In a paragraph the serif reads as shrunken text rather than as a change
    // of voice — Instrument Serif runs a far shorter x-height than Inter at the
    // identical font-size — so body italics stay on the body face and lean on
    // weight instead.
    const lead = screen.getByTestId('about-lead');
    const bodyItalic = lead.querySelector('em');
    expect(bodyItalic).toHaveTextContent('design');
    expect(bodyItalic).toHaveClass('italic', 'font-semibold');
    expect(bodyItalic).not.toHaveClass('font-serif');

    // The statement is large enough for that same swap to read as intended.
    const headlineItalic = screen.getByTestId('about-statement').querySelector('em');
    expect(headlineItalic).toHaveClass('font-serif', 'italic');
  });

  it('does not draw a divider above the paper version', () => {
    const { container } = render(
      <AboutSection tone="paper" content={baseContent} />,
    );

    expect(container.querySelector('#about')).not.toHaveClass('border-t');
  });

  it('shows every biography paragraph outright, with nothing to expand', () => {
    render(<AboutSection content={baseContent} />);

    const copy = screen.getByTestId('about-copy');
    expect(copy).toHaveTextContent('First biography paragraph.');
    expect(copy).toHaveTextContent('Second biography paragraph.');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('reveals immediately when no split transition gates it', () => {
    const { container } = render(<AboutSection content={baseContent} />);

    expect(container.querySelector('#about')).toHaveAttribute(
      'data-revealed',
      'true',
    );
  });

  it('releases the headline before the lower blocks, and reverses with the split', () => {
    const progress = motionValue(0);
    const { container } = render(
      <AboutSection
        tone="paper"
        content={baseContent}
        splitProgress={progress}
      />,
    );
    const about = container.querySelector('#about');
    const stages = () => [
      about?.getAttribute('data-revealed'),
      about?.getAttribute('data-body-revealed'),
    ];

    expect(stages()).toEqual(['false', 'false']);

    // Mid-transition nothing is on paper yet.
    act(() => progress.set(0.5));
    expect(stages()).toEqual(['false', 'false']);

    // The heading and statement clear the band well before the lower blocks.
    act(() => progress.set(0.8));
    expect(stages()).toEqual(['true', 'false']);

    act(() => progress.set(0.97));
    expect(stages()).toEqual(['true', 'true']);

    // Inside the hysteresis bands both reveals stay latched open.
    act(() => progress.set(0.9));
    expect(stages()).toEqual(['true', 'true']);

    act(() => progress.set(0.85));
    expect(stages()).toEqual(['true', 'false']);

    act(() => progress.set(0.6));
    expect(stages()).toEqual(['false', 'false']);
  });

  it('falls back to the initials on the badge until a photo is supplied', () => {
    render(<AboutSection content={baseContent} />);

    const badge = screen.getByTestId('about-badge');
    expect(badge.querySelector('img')).toBeNull();
    expect(badge).toHaveTextContent('SN');
    expect(badge).toHaveTextContent('Seu Nome');
  });

  it('shows the supplied portrait photo on the badge when there is one', () => {
    render(
      <AboutSection content={{ ...baseContent, portrait: '/portrait.jpg' }} />,
    );

    const image = screen.getByRole('img', { name: /seu nome/i });
    expect(image).toHaveAttribute('src', '/portrait.jpg');
  });
});
