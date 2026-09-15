'use client';

import { useRef, useState, type PointerEvent } from 'react';
import {
  motion,
  useMotionValueEvent,
  useTransform,
  type MotionValue,
} from 'motion/react';

import type { Project } from '@/content/portfolio';
import { useReducedMotionPreference } from '@/hooks/use-reduced-motion-preference';
import { getProjectTilt, supportsProjectTilt } from './project-art';
import {
  getDiagonalSlot,
  getParallaxTransform,
  getProgressBarShift,
  getRailShift,
  getSlabTransform,
  progressToProjectIndex,
} from './project-diagonal';
import { ProjectRepositoryLink } from './project-repository-link';
import { ProjectShot } from './project-shot';
import { ProjectTechnologyList } from './project-technology-list';

type ProjectDiagonalStageProps = {
  projects: Project[];
  progress: MotionValue<number>;
};

/**
 * One project's picture, crossing the stage.
 *
 * Nothing here animates opacity, and that is deliberate rather than an
 * omission: the slabs are opaque and simply pass each other, the way the
 * reference does it. A cross-fade between two of these would put two pictures
 * half-visible on top of each other, which is the artefact this section has
 * been through twice already.
 */
function DiagonalSlab({
  index,
  project,
  progress,
  count,
}: {
  index: number;
  project: Project;
  progress: MotionValue<number>;
  count: number;
}) {
  const reduceMotion = useReducedMotionPreference();
  const frameRef = useRef<HTMLDivElement>(null);
  const boundsRef = useRef<DOMRect | null>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, z: 0 });

  const slot = useTransform(() =>
    getDiagonalSlot(index, progress.get(), count),
  );
  const frameX = useTransform(() => `${getSlabTransform(slot.get()).x}vw`);
  const frameY = useTransform(() => `${getSlabTransform(slot.get()).y}vh`);
  const driftX = useTransform(() => `${getParallaxTransform(slot.get()).x}vw`);
  const driftY = useTransform(() => `${getParallaxTransform(slot.get()).y}vh`);

  const canTilt = (event: PointerEvent<HTMLDivElement>) => {
    const capablePointer = window.matchMedia(
      '(hover: hover) and (pointer: fine)',
    ).matches;
    return (
      event.isPrimary &&
      supportsProjectTilt(event.pointerType, reduceMotion, capablePointer)
    );
  };

  const beginTilt = (event: PointerEvent<HTMLDivElement>) => {
    if (!canTilt(event) || !frameRef.current) return;
    // Capture the untransformed geometry once. Reading the rectangle after
    // every rotation feeds the transform back into its own calculation and is
    // what made the previous hover shake near the edges.
    boundsRef.current = frameRef.current.getBoundingClientRect();
  };

  const trackTilt = (event: PointerEvent<HTMLDivElement>) => {
    if (!canTilt(event) || !frameRef.current) return;
    const bounds =
      boundsRef.current ?? frameRef.current.getBoundingClientRect();
    boundsRef.current = bounds;
    setTilt(getProjectTilt(event.clientX, event.clientY, bounds));
  };

  const resetTilt = () => {
    boundsRef.current = null;
    setTilt({ rotateX: 0, rotateY: 0, z: 0 });
  };

  return (
    <motion.div
      aria-hidden={index === 0 ? undefined : true}
      className="absolute inset-0 flex items-center justify-end will-change-transform"
      data-project={project.slug}
      data-testid="project-slab"
      style={{ x: frameX, y: frameY, paddingRight: '5vw' }}
    >
      <div
        className="relative w-[46vw] max-w-[58rem]"
        data-testid="project-media-column"
        style={{ perspective: '1200px' }}
      >
        <motion.div
          animate={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY, z: tilt.z }}
          className="w-full overflow-hidden border border-white/15 bg-graphite shadow-2xl will-change-transform"
          data-testid="project-slab-frame"
          onPointerEnter={beginTilt}
          onPointerLeave={resetTilt}
          onPointerMove={trackTilt}
          ref={frameRef}
          style={{ transformOrigin: 'center', transformStyle: 'preserve-3d' }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 0.52, ease: [0.22, 1, 0.36, 1] }
          }
        >
          {/* The picture drifts inside its own frame on an eased curve while the
              frame travels on a straight one. Two linear moves would compose into
              a third linear move and the depth would be gone. */}
          <motion.div
            className="will-change-transform"
            style={{ x: driftX, y: driftY }}
          >
            <ProjectShot project={project} />
          </motion.div>
        </motion.div>
        <ProjectRepositoryLink
          className="pointer-events-auto absolute left-0 top-[calc(100%+1.25rem)]"
          href={project.repository}
          tabIndex={index === 0 ? 0 : -1}
          title={project.title}
        />
      </div>
    </motion.div>
  );
}

/**
 * The whole of a project's text, in a masked column that slides one project per
 * step. The swap is a movement, never a fade — two blocks fading through each
 * other is the artefact this section has already produced twice.
 *
 * One rail carrying complete blocks rather than a rail per line. Four tickers
 * running at once each showed half of one project and half of the next
 * mid-slide, and the result was unreadable clutter; a single rail shows one
 * block leaving as one block arrives, which is what the reference does.
 */
const ROW_HEIGHT = '30rem';

function ProjectTextRail({
  count,
  progress,
  projects,
}: {
  count: number;
  progress: MotionValue<number>;
  projects: Project[];
}) {
  const shift = useTransform(() => `${getRailShift(progress.get(), count)}%`);

  return (
    <div
      data-testid="project-text-rail"
      style={{
        height: ROW_HEIGHT,
        overflow: 'hidden',
        // Softens the cut at the mask's edges. Half a line of type sliced dead
        // straight reads as a mistake mid-slide; faded, it reads as a ticker.
        maskImage:
          'linear-gradient(to bottom, transparent, #000 9%, #000 91%, transparent)',
      }}
    >
      <motion.div className="will-change-transform" style={{ y: shift }}>
        {projects.map((project) => (
          <div
            className="flex flex-col justify-center"
            key={project.slug}
            style={{ height: ROW_HEIGHT }}
          >
            <h3 className="max-w-[12ch] font-display text-[clamp(3.4rem,6.2vw,7.5rem)] font-medium leading-[0.88] tracking-[-0.05em]">
              {project.title}
            </h3>
            <p className="mt-5 text-sm uppercase tracking-[0.15em] text-paper/70">
              {project.role}
            </p>
            <p className="mt-5 max-w-[38ch] text-lg leading-relaxed text-muted-foreground xl:text-xl">
              {project.summary}
            </p>
            <ProjectTechnologyList
              className="mt-6"
              decorative
              projectTitle={project.title}
              technologies={project.stack}
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export function ProjectDiagonalStage({
  projects,
  progress,
}: ProjectDiagonalStageProps) {
  const count = projects.length;
  const stageRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(0);
  const barShift = useTransform(
    () => `${getProgressBarShift(progress.get(), count)}%`,
  );

  useMotionValueEvent(progress, 'change', (latest) => {
    const nextIndex = progressToProjectIndex(latest, count);
    if (nextIndex === activeIndexRef.current) return;

    /**
     * Accessibility state changes only when a project crosses the midpoint.
     * Applying those two small attributes directly keeps that threshold out of
     * React's render path: re-rendering four viewport-sized slabs at exactly
     * half a turn is the hitch that made an otherwise fluid snap feel locked.
     */
    const slabs = stageRef.current?.querySelectorAll<HTMLElement>(
      '[data-testid="project-slab"]',
    );
    const previous = slabs?.item(activeIndexRef.current);
    const next = slabs?.item(nextIndex);

    previous?.setAttribute('aria-hidden', 'true');
    const previousLink = previous?.querySelector<HTMLAnchorElement>('a');
    if (previousLink) previousLink.tabIndex = -1;

    next?.removeAttribute('aria-hidden');
    const nextLink = next?.querySelector<HTMLAnchorElement>('a');
    if (nextLink) nextLink.tabIndex = 0;

    activeIndexRef.current = nextIndex;
  });

  /**
   * The stage takes a wash of whichever project is coming round, interpolated
   * across the crossing so the colour arrives with the picture rather than
   * switching under it.
   *
   * Laid on at low alpha over the ink and pushed to one corner: these are
   * screenshot colours, and at any strength that reads as a colour they fight
   * the monochrome the rest of the site is built on.
   */
  const tint = useTransform(
    progress,
    projects.map((_, index) => (count <= 1 ? 0 : index / (count - 1))),
    projects.map((project) => project.accent),
  );
  const wash = useTransform(
    () =>
      `radial-gradient(120% 90% at 78% 62%, color-mix(in oklab, ${tint.get()} 16%, transparent), transparent 68%)`,
  );

  return (
    <div
      className="relative h-svh overflow-hidden bg-ink"
      data-testid="project-diagonal-stage"
      ref={stageRef}
    >
      <div className="absolute inset-0">
        <motion.div
          className="pointer-events-none absolute inset-0"
          data-testid="project-stage-wash"
          style={{ backgroundImage: wash }}
        />

        {projects.map((project, index) => (
          <DiagonalSlab
            count={count}
            index={index}
            key={project.slug}
            progress={progress}
            project={project}
          />
        ))}

        {/* The text sits above every slab and never travels with them, which is
          how the reference keeps a project's name readable while its picture is
          still crossing the screen. */}
        {/*
        Bounded to the left column. The frame's own left edge sits at 52vw —
        100 less the 8vw of padding and its 40vw of width — so stopping the text
        at 44vw leaves a gap that holds its proportion at any viewport. Left
        unbounded, the stack line ran the full width and passed under the frame.
      */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 flex max-w-[44vw] flex-col justify-center px-page"
          data-testid="project-copy-column"
        >
          <ProjectTextRail
            count={count}
            progress={progress}
            projects={projects}
          />
        </div>

        {/* How far through the set the reader is. */}
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-[calc(var(--page-gutter)/2)] z-10 flex items-center"
        >
          <div className="h-40 w-[3px] overflow-hidden rounded-full bg-white/12">
            <motion.div
              className="w-full rounded-full bg-paper will-change-transform"
              data-testid="project-progress-bar"
              style={{ height: `${100 / count}%`, y: barShift }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
