import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { portfolioContent } from '@/content/portfolio';
import Home from './page';

describe('portfolio shell', () => {
  it('keeps the primary content and footer in the document flow', () => {
    render(<Home />);

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByTestId('hero-about-transition')).toBeInTheDocument();
    // Read off the content rather than spelled out here: this asserts that the
    // hero renders the role as the page's one h1, not what the role happens to
    // say this week.
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: new RegExp(portfolioContent.person.role, 'i'),
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('heading', { name: /selected work/i }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
