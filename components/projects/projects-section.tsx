'use client';

/* oxlint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex -- The carousel region is intentionally focusable for arrow-key navigation. */

import { useRef, useState, type KeyboardEvent, type UIEvent } from 'react';
import { motion, useTransform, type MotionValue } from 'motion/react';

import { SectionHeading } from '@/components/ui/section-heading';
import type { Project } from '@/content/portfolio';
import { useProjectSnap } from '@/hooks/use-project-snap';
import { useReducedMotionPreference } from '@/hooks/use-reduced-motion-preference';
import { cn } from '@/lib/utils';
import { ProjectCard } from './project-card';
import { ProjectDiagonalStage } from './project-diagonal-stage';
import { ProjectRepositoryLink } from './project-repository-link';
import { ProjectTechnologyList } from './project-technology-list';
import { useCopy } from "@/components/providers/language-provider";

type ProjectsSectionProps = {
  projects: Project[];
  mobileOnly?: boolean;
  sceneProgress?: MotionValue<number>;
};

type ProjectCardGeometry = Pick<HTMLElement, 'offsetLeft' | 'offsetWidth'>;

export function findNearestProjectIndex(
  scrollLeft: number,
  viewportWidth: number,
  cards: ProjectCardGeometry[],
) {
  if (cards.length === 0) return 0;

  const viewportCenter = scrollLeft + viewportWidth / 2;
  return cards.reduce((nearestIndex, card, index) => {
    const nearestCard = cards[nearestIndex];
    const cardDistance = Math.abs(
      card.offsetLeft + card.offsetWidth / 2 - viewportCenter,
    );
    const nearestDistance = Math.abs(
      nearestCard.offsetLeft + nearestCard.offsetWidth / 2 - viewportCenter,
    );
    return cardDistance < nearestDistance ? index : nearestIndex;
  }, 0);
}

type DesktopProjectsCanvasProps = {
  progress: MotionValue<number>;
  projects: Project[];
};

/** The project experience itself, independent from whichever rail owns it. */
function DesktopProjectsCanvas({
  progress,
  projects,
}: DesktopProjectsCanvasProps) {
  const copy = useCopy();
  const [fallbackOpen, setFallbackOpen] = useState(false);

  return (
    <div
      className="relative h-svh overflow-hidden"
      data-testid="project-desktop-canvas"
    >
      <div className="px-page">
        <h2 className="sr-only">{copy.selectedWork}</h2>
        <div
          className={
            fallbackOpen
              ? 'absolute left-[var(--page-gutter)] top-24 z-[80] max-h-[calc(100vh-7rem)] w-[min(34rem,calc(100vw-(var(--page-gutter)*2)))] overflow-auto border border-white/20 bg-ink p-6 text-paper'
              : 'sr-only focus-within:not-sr-only focus-within:absolute focus-within:left-[var(--page-gutter)] focus-within:top-24 focus-within:z-[80] focus-within:max-h-[calc(100vh-7rem)] focus-within:w-[min(34rem,calc(100vw-(var(--page-gutter)*2)))] focus-within:overflow-auto focus-within:border focus-within:border-white/20 focus-within:bg-ink focus-within:p-6 focus-within:text-paper'
          }
        >
          <button
            aria-controls="projects-fallback-list"
            aria-expanded={fallbackOpen}
            className="focus-ring text-label uppercase"
            onClick={() => setFallbackOpen(true)}
            type="button"
          >
            {copy.browseAllProjects}
          </button>
          <ol
            aria-label={copy.allSelectedProjects}
            className="mt-6"
            id="projects-fallback-list"
          >
            {projects.map((project) => (
              <li key={project.slug}>
                <article>
                  <p>{project.role}</p>
                  <h3>{project.title}</h3>
                  <p>{project.summary}</p>
                  <ProjectTechnologyList
                    className="mt-4"
                    projectTitle={project.title}
                    technologies={project.stack}
                  />
                  <ProjectRepositoryLink
                    className="mt-5"
                    href={project.repository}
                    title={project.title}
                  />
                </article>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <ProjectDiagonalStage progress={progress} projects={projects} />
    </div>
  );
}

export function ProjectsSection({
  mobileOnly = false,
  projects,
  sceneProgress,
}: ProjectsSectionProps) {
  if (sceneProgress) {
    return (
      <DesktopProjectsCanvas progress={sceneProgress} projects={projects} />
    );
  }

  return (
    <StandaloneProjectsSection mobileOnly={mobileOnly} projects={projects} />
  );
}

/**
 * Owns the independent project rail used outside the shared Stack → Projects
 * scene. Keeping it behind a component boundary matters: the shared scene
 * already owns its scroll progress and never renders this component's rail,
 * so mounting `useScroll` there would leave its target ref unhydrated.
 */
function StandaloneProjectsSection({
  mobileOnly = false,
  projects,
}: Omit<ProjectsSectionProps, 'sceneProgress'>) {
  const { railRef, markersRef, scrollYProgress, arrival } = useProjectSnap(
    projects.length,
  );
  const reduceMotion = useReducedMotionPreference();
  const copy = useCopy();

  /**
   * Comes in from the right as the stack goes out to the left, the two crossing
   * over one held screen. Runs off the rail's own lead, so the crossing and the
   * scroll it is spent over cannot drift apart.
   */
  const enterX = useTransform(arrival, (value) =>
    reduceMotion ? '0vw' : `${(1 - value) * 100}vw`,
  );
  const [mobileIndex, setMobileIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const lastIndex = Math.max(0, projects.length - 1);

  const goToProject = (requestedIndex: number) => {
    const nextIndex = Math.min(lastIndex, Math.max(0, requestedIndex));
    setMobileIndex(nextIndex);
    const card = carouselRef.current?.children.item(nextIndex);
    if (card instanceof HTMLElement) {
      card.scrollIntoView?.({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  };

  const updateFromScroll = (event: UIEvent<HTMLDivElement>) => {
    const rail = event.currentTarget;
    const cards = Array.from(rail.children).filter(
      (card): card is HTMLElement => card instanceof HTMLElement,
    );
    if (rail.clientWidth === 0 || cards.length === 0) return;
    setMobileIndex(
      Math.min(
        lastIndex,
        findNearestProjectIndex(rail.scrollLeft, rail.clientWidth, cards),
      ),
    );
  };

  const handleKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goToProject(mobileIndex + 1);
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goToProject(mobileIndex - 1);
    }
  };

  return (
    /*
      Lifted to sit beside the stack rather than below it.

      The stack does not scroll away — it is held and slid off to the left — so
      this section has to be alongside it to come in from the right as it goes.
      The amount is the stack's own lock span (100svh) plus the screen it is
      held on (100svh) plus how far below flush it locks (13.5svh); the stack's
      height cancels out of that sum, which is why it can be a fixed length
      rather than something measured.

      Desktop only: below `lg` the stage is not rendered and the stack never
      slides, so there is nothing to sit beside.
    */
    <section
      id="projects"
      className={cn(
        'relative border-t border-white/15 py-24 sm:py-28',
        !mobileOnly && 'lg:-mt-[213.5svh] lg:py-0 lg:motion-reduce:mt-0',
      )}
    >
      {/*
        Where this section really begins, for anything that measures it.

        The lift above put the section's own top in the middle of the stack's
        lock, and both the navbar's selection and the nav's scroll target read
        that box: the navbar called the whole stack "projects", and clicking
        projects landed on the stack. This skips the lead and covers the four
        project screens instead — which is also why it is a region and not a
        line, since the navbar needs an extent and the nav needs its top.

        Below `lg` the stage is not rendered, the section is not lifted, and
        there is no lead, so it covers the section as it stands.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 lg:top-[100svh]"
        data-scroll-anchor="true"
      />

      <div className="px-page lg:hidden">
        <SectionHeading eyebrow={copy.projectsEyebrow} title={copy.selectedWork} />
      </div>

      <div className={mobileOnly ? 'hidden' : 'hidden lg:block'}>
        <div
          className="relative"
          data-testid="desktop-project-stage"
          ref={railRef}
        >
          {/*
            Four screens of scrolling and the snap's stops, laid out absolutely
            so they set the positions without taking part in the stage's own
            layout. The rail's height comes from the block below them.
          */}
          {/*
            Pushed down past the lead, so the snap's stops line up with the
            projects rather than with the crossing before them.
          */}
          <div
            className="pointer-events-none absolute inset-x-0 top-[100svh]"
            ref={markersRef}
          >
            {projects.map((project) => (
              <div
                className="h-svh"
                data-testid="project-marker"
                key={project.slug}
              />
            ))}
          </div>

          {/*
            Five screens, not four: one for the crossing from the stack, then
            one per project. `PROJECT_LEAD` is that first screen's share, and
            the two are declared together here for that reason.
          */}
          <div className="h-[500svh]">
            <div className="sticky top-0 overflow-hidden">
              <motion.div style={{ x: enterX }}>
                <DesktopProjectsCanvas
                  progress={scrollYProgress}
                  projects={projects}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16 lg:hidden">
        <section
          aria-label={copy.allSelectedProjects}
          aria-roledescription="carousel"
          className="focus-ring flex snap-x snap-mandatory gap-4 overflow-x-auto px-page pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onKeyDown={handleKeys}
          onScroll={updateFromScroll}
          ref={carouselRef}
          tabIndex={0}
        >
          {projects.map((project, index) => (
            <ProjectCard
              key={project.slug}
              active={index === mobileIndex}
              className="w-[calc(100vw-(var(--page-gutter)*2))] max-w-[46rem] grid-rows-[auto_auto_1fr]"
              project={project}
            />
          ))}
        </section>

        <div className="mt-6 flex items-center justify-between px-page">
          <p
            aria-live="polite"
            className="text-label uppercase text-muted-foreground"
          >
            Project {String(mobileIndex + 1).padStart(2, '0')} /{' '}
            {String(projects.length).padStart(2, '0')}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label={copy.previousProject}
              className="focus-ring grid size-11 place-items-center rounded-full border border-white/20 disabled:cursor-not-allowed disabled:opacity-30"
              disabled={mobileIndex === 0}
              onClick={() => goToProject(mobileIndex - 1)}
            >
              ←
            </button>
            <button
              type="button"
              aria-label={copy.nextProject}
              className="focus-ring grid size-11 place-items-center rounded-full border border-white/20 disabled:cursor-not-allowed disabled:opacity-30"
              disabled={mobileIndex === lastIndex}
              onClick={() => goToProject(mobileIndex + 1)}
            >
              →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
