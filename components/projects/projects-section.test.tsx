import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { act } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { motionValue } from 'motion/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { portfolioContent } from '@/content/portfolio';
import { getProjectTilt, supportsProjectTilt } from './project-art';
import {
  getDiagonalSlot,
  getParallaxTransform,
  getProgressBarShift,
  getRailShift,
  getSlabTransform,
  progressToProjectIndex,
} from './project-diagonal';
import { findNearestProjectIndex, ProjectsSection } from './projects-section';

const projects = [
  {
    slug: 'one',
    title: 'Obsidian',
    year: '2026',
    role: 'Design & Development',
    summary: 'A monochrome product experience built around clarity and motion.',
    stack: ['Next.js', 'Motion'],
    image: '/projects/one.png',
    repository: 'https://github.com/example/obsidian',
    accent: '#60A5FA',
    artDirection: 'orbital' as const,
  },
  {
    slug: 'two',
    title: 'Monolith',
    year: '2026',
    role: 'Frontend',
    summary: 'An editorial platform with a precise modular publishing system.',
    stack: ['React', 'TypeScript'],
    image: '/projects/two.png',
    repository: 'https://github.com/example/monolith',
    accent: '#FB923C',
    artDirection: 'grid' as const,
  },
];

describe('ProjectsSection', () => {
  it('ships a real screenshot for every portfolio project', () => {
    for (const project of portfolioContent.projects) {
      const assetPath = join(
        process.cwd(),
        'public',
        project.image.replace(/^\//, ''),
      );
      expect(
        existsSync(assetPath),
        `${project.title} is missing ${project.image}`,
      ).toBe(true);
    }
  });

  it('lists projects and changes the active project with controls', async () => {
    const user = userEvent.setup();
    render(<ProjectsSection projects={projects} />);

    expect(screen.getByRole('article', { name: 'Obsidian' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    await user.click(screen.getByRole('button', { name: /next project/i }));
    expect(screen.getByRole('article', { name: 'Monolith' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(
      screen.getByRole('button', { name: /next project/i }),
    ).toBeDisabled();
    expect(
      screen.queryByRole('link', { name: /case study/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: 'View Obsidian repository' }).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText('Case study / Soon')).not.toBeInTheDocument();
  });

  it('supports arrow-key navigation and announces the active position', async () => {
    const user = userEvent.setup();
    render(<ProjectsSection projects={projects} />);

    const carousel = screen.getByRole('region', { name: /selected projects/i });
    await user.click(carousel);
    await user.keyboard('{ArrowRight}');

    expect(screen.getByText('Project 02 / 02')).toHaveAttribute(
      'aria-live',
      'polite',
    );
    expect(
      screen.getByRole('button', { name: /previous project/i }),
    ).toBeEnabled();
  });

  it('bounds the pointer tilt and refuses it where it does not belong', () => {
    expect(
      getProjectTilt(500, -500, { left: 0, top: 0, width: 100, height: 100 }),
    ).toEqual({
      rotateX: 5,
      rotateY: 5,
      z: 28,
    });
    expect(supportsProjectTilt('touch', false, true)).toBe(false);
    expect(supportsProjectTilt('mouse', true, true)).toBe(false);
    expect(supportsProjectTilt('mouse', false, true)).toBe(true);
  });

  it('uses actual card geometry for landscape-tablet carousel state', () => {
    const cards = [48, 800, 1552, 2304].map((offsetLeft) => ({
      offsetLeft,
      offsetWidth: 736,
    }));

    expect(findNearestProjectIndex(2168, 920, cards)).toBe(3);
  });

  it('provides a complete semantic desktop collection independent of the animated stage', () => {
    render(<ProjectsSection projects={projects} />);

    const list = screen.getByRole('list', { name: 'All selected projects' });
    expect(
      screen.getByRole('button', { name: /browse all selected projects/i }),
    ).toHaveAttribute('aria-controls', 'projects-fallback-list');
    expect(
      within(list).getByRole('heading', { name: 'Obsidian' }),
    ).toBeInTheDocument();
    expect(
      within(list).getByRole('heading', { name: 'Monolith' }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('heading', { name: 'Selected work' }),
    ).toHaveLength(2);
    expect(
      screen.getByTestId('desktop-project-stage').parentElement,
    ).not.toHaveAttribute('inert');
  });

  it('puts every project on the stage, with a stop for each', () => {
    render(<ProjectsSection projects={projects} />);

    const slabs = screen.getAllByTestId('project-slab');
    expect(slabs.map((slab) => slab.dataset.project)).toEqual(['one', 'two']);
    expect(screen.getAllByTestId('project-marker')).toHaveLength(
      projects.length,
    );
  });

  it('uses a larger media column beside a closer stacked copy column', () => {
    render(<ProjectsSection projects={projects} />);

    expect(screen.getAllByTestId('project-media-column')[0]).toHaveClass(
      'w-[46vw]',
    );
    expect(screen.getByTestId('project-copy-column')).toHaveClass(
      'max-w-[44vw]',
    );
  });

  it('puts perspective outside the rotating project frame', () => {
    render(<ProjectsSection projects={projects} />);

    const [frame] = screen.getAllByTestId('project-slab-frame');
    expect(frame.parentElement).toHaveStyle({ perspective: '1200px' });
    expect(frame).not.toHaveStyle({ perspective: '1100px' });
  });

  it('shows technology marks and repository access in every project layout', () => {
    render(<ProjectsSection projects={projects} />);

    const technologyLists = screen.getAllByRole('list', {
      name: 'Obsidian technologies',
    });
    expect(technologyLists.length).toBeGreaterThanOrEqual(2);
    for (const list of technologyLists) {
      expect(
        within(list).getAllByTestId('project-technology-icon'),
      ).toHaveLength(2);
    }

    expect(
      screen.getAllByRole('link', { name: 'View Obsidian repository' }).length,
    ).toBeGreaterThanOrEqual(2);
  });

  it('keeps project ordering numbers out of the project presentation', () => {
    render(<ProjectsSection projects={projects} />);

    expect(screen.queryByText('[ 01 ]')).not.toBeInTheDocument();
    expect(screen.queryByText('[ 02 ]')).not.toBeInTheDocument();
    expect(screen.queryByText('01')).not.toBeInTheDocument();
    expect(screen.queryByText('02')).not.toBeInTheDocument();
  });

  it('uses branded icons for every published project technology', () => {
    render(<ProjectsSection projects={portfolioContent.projects} />);

    expect(screen.queryByTestId('stack-icon-fallback')).not.toBeInTheDocument();
  });

  it('explains project technologies with the same accessible interaction as the stack', async () => {
    const user = userEvent.setup();
    render(<ProjectsSection projects={portfolioContent.projects} />);

    const [technologyList] = screen.getAllByRole('list', {
      name: 'Meu Financeiro technologies',
    });
    const next = within(technologyList).getByRole('button', {
      name: 'Next.js',
    });

    next.focus();
    const panel = await screen.findByTestId('stack-tool-panel');
    expect(panel).toHaveTextContent(
      'Routing, rendering and the build for React.',
    );

    await user.keyboard('{Escape}');
    expect(screen.queryByTestId('stack-tool-panel')).not.toBeInTheDocument();
  });

  /**
   * The desktop stage paints the same technologies a second time, for the eye
   * only, in a column that is `aria-hidden` because the list above already
   * speaks them. Making those chips into buttons put twenty focusable elements
   * inside that hidden subtree — measured in the browser, a keyboard reached
   * every one of them after the accessible list, each announcing nothing.
   */
  it('keeps the decorative stage technologies out of the tab order', () => {
    render(<ProjectsSection projects={portfolioContent.projects} />);

    const column = screen.getAllByTestId('project-copy-column')[0];
    const decorative = within(column).getAllByTestId('stack-tool');
    expect(decorative.length).toBeGreaterThan(0);
    for (const chip of decorative) {
      expect(chip).toHaveAttribute('tabindex', '-1');
    }

    const [spoken] = screen.getAllByRole('list', {
      name: 'Meu Financeiro technologies',
    });
    for (const chip of within(spoken).getAllByRole('button')) {
      expect(chip).not.toHaveAttribute('tabindex', '-1');
    }
  });

  it('carries each repository action with its own animated project slab', () => {
    render(<ProjectsSection projects={projects} />);

    const slabs = screen.getAllByTestId('project-slab');
    expect(
      slabs[0].querySelector('a[aria-label="View Obsidian repository"]'),
    ).toBeInTheDocument();
    expect(
      slabs[1].querySelector('a[aria-label="View Monolith repository"]'),
    ).toBeInTheDocument();
  });

  it('renders the shared desktop scene without an orphaned scroll target', () => {
    const progress = motionValue(0);
    render(<ProjectsSection projects={projects} sceneProgress={progress} />);

    const slabs = screen.getAllByTestId('project-slab');
    const firstLink = slabs[0].querySelector('a');
    const secondLink = slabs[1].querySelector('a');

    expect(slabs[0]).not.toHaveAttribute('aria-hidden');
    expect(firstLink).toHaveAttribute('tabindex', '0');
    expect(slabs[1]).toHaveAttribute('aria-hidden', 'true');
    expect(secondLink).toHaveAttribute('tabindex', '-1');

    act(() => progress.set(1));

    expect(slabs[0]).toHaveAttribute('aria-hidden', 'true');
    expect(firstLink).toHaveAttribute('tabindex', '-1');
    expect(slabs[1]).not.toHaveAttribute('aria-hidden');
    expect(secondLink).toHaveAttribute('tabindex', '0');
  });

  it('keeps project dates out of every visual and accessible layout', () => {
    render(<ProjectsSection projects={projects} />);

    expect(screen.queryAllByText(/2026/)).toHaveLength(0);
  });

  it('lists every project in each text rail, so the swap is a slide', () => {
    render(<ProjectsSection projects={projects} />);

    // The rails carry all the rows at once and move; nothing is mounted or
    // unmounted as the reader scrolls, which is what keeps the text from
    // fading through itself.
    const title = screen.getByTestId('project-text-rail');
    expect(title).toHaveTextContent('Obsidian');
    expect(title).toHaveTextContent('Monolith');
    expect(screen.getByTestId('project-progress-bar')).toBeInTheDocument();
  });

  it('falls back to the generated art when a screenshot is missing', () => {
    render(<ProjectsSection projects={projects} />);

    const shots = screen.getAllByTestId('project-shot-image');
    const [shot] = shots;
    expect(shot).toHaveAttribute('src', '/projects/one.png');

    // The files are dropped into `public/` by hand, so a missing one has to
    // read as a placeholder rather than a broken image.
    fireEvent.error(shot);
    expect(screen.getAllByTestId('project-shot-image')).toHaveLength(
      shots.length - 1,
    );
    expect(screen.getAllByTestId('project-shot')).toHaveLength(shots.length);
  });
});

describe('diagonal stage geometry', () => {
  it('centres the project the reader has reached and parks the rest on the diagonal', () => {
    // 0 is centred, +1 waits off the bottom-right, -1 has left top-left.
    expect(getDiagonalSlot(0, 0, 4)).toBe(0);
    expect(getDiagonalSlot(1, 0, 4)).toBe(1);
    expect(getDiagonalSlot(0, 1 / 3, 4)).toBeCloseTo(-1, 6);
    expect(getDiagonalSlot(3, 1, 4)).toBe(0);
    // Out of range stays in range.
    expect(getDiagonalSlot(0, -5, 4)).toBe(0);
    expect(getDiagonalSlot(3, 5, 4)).toBe(0);
  });

  it('moves x and y together, which is the whole of the diagonal', () => {
    expect(getSlabTransform(1)).toEqual({ x: 70, y: 90 });
    expect(getSlabTransform(0)).toEqual({ x: 0, y: 0 });
    expect(getSlabTransform(-1)).toEqual({ x: -70, y: -90 });
  });

  it("drifts the picture on an eased curve, not the frame's straight one", () => {
    // Same endpoints as the frame, different shape — two linear moves would
    // compose into a third linear move and the depth would be gone.
    expect(getParallaxTransform(0)).toEqual({ x: 0, y: 0 });
    expect(getParallaxTransform(1).x).toBeCloseTo(3, 6);
    expect(getParallaxTransform(-1).x).toBeCloseTo(-3, 6);
    expect(getParallaxTransform(0.25).x).not.toBeCloseTo(0.75, 2);
    // Mirrored about zero, or a negative slot would ease backwards.
    expect(getParallaxTransform(-0.25).x).toBeCloseTo(
      -getParallaxTransform(0.25).x,
      6,
    );
  });

  it('slides the rails by one row per project', () => {
    // The column is `count` rows tall, so one project is 100/count percent.
    expect(getRailShift(0, 4)).toBe(0);
    expect(getRailShift(1 / 3, 4)).toBeCloseTo(-25, 6);
    expect(getRailShift(1, 4)).toBeCloseTo(-75, 6);
  });

  it('steps the progress bar in units of its own height', () => {
    // Not the rails' number: the bar is one block stepping down a track, and
    // reusing the rails' denominator put it out by a factor of `count`.
    expect(getProgressBarShift(0, 4)).toBe(0);
    expect(getProgressBarShift(1, 4)).toBe(300);
    expect(getProgressBarShift(1 / 3, 4)).toBeCloseTo(100, 6);
  });

  it('rounds to the project the reader has settled on', () => {
    expect(progressToProjectIndex(0, 4)).toBe(0);
    expect(progressToProjectIndex(1 / 3, 4)).toBe(1);
    expect(progressToProjectIndex(1, 4)).toBe(3);
    expect(progressToProjectIndex(0.5, 1)).toBe(0);
  });
});
