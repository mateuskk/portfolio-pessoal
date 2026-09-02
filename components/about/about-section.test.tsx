import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AboutSection } from './about-section';

describe('AboutSection', () => {
  it('presents the biography, availability, and portrait placeholder', () => {
    render(
      <AboutSection
        content={{
          statement: 'Clarity and character, built together.',
          paragraphs: [
            'First biography paragraph.',
            'Second biography paragraph.',
          ],
          availability: 'Available for selected projects',
        }}
      />,
    );

    expect(
      screen.getByRole('heading', { name: /about me/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Clarity and character, built together.'),
    ).toBeVisible();
    expect(screen.getByText('Available for selected projects')).toBeVisible();
    expect(screen.getByLabelText(/portrait placeholder/i)).toBeInTheDocument();
  });

  it('does not draw a divider above the paper version', () => {
    const { container } = render(
      <AboutSection
        tone="paper"
        content={{
          statement: 'Clarity and character, built together.',
          paragraphs: [
            'First biography paragraph.',
            'Second biography paragraph.',
          ],
          availability: 'Available for selected projects',
        }}
      />,
    );

    expect(container.querySelector('#about')).not.toHaveClass('border-t');
  });
});
