'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'motion/react';

import { ProjectsSection } from '@/components/projects/projects-section';
import {
  STACK_PIN_DROP,
  STACK_SLIDE_SPRING,
  StackPanel,
  StackSection,
} from '@/components/stack/stack-section';
import type { Project, StackGroup } from '@/content/portfolio';
import { useProjectSnap } from '@/hooks/use-project-snap';
import { useReducedMotionPreference } from '@/hooks/use-reduced-motion-preference';

/**
 * Width and input together, never width alone.
 *
 * `(min-width: 1024px)` was the whole test, and an iPad Pro reports 1032:
 * a tablet was handed the pinned scene, whose negative margins are sized for a
 * desktop composition, and it rode up over the about section. From the reader's
 * side the about had simply vanished. `pointer: fine` is what says this is a
 * machine with a mouse, which is the one this layout was built for.
 */
const DESKTOP_QUERY = '(min-width: 1024px) and (pointer: fine)';

type StackProjectsSceneProps = {
  groups: StackGroup[];
  items: string[];
  projects: Project[];
};

type SceneGeometry = {
  handoffStart: number;
  projectSpan: number;
  projectsStart: number;
  railHeight: number;
  scrollSpan: number;
  viewportHeight: number;
  viewportWidth: number;
};

const initialGeometry: SceneGeometry = {
  handoffStart: 0,
  projectSpan: 1,
  projectsStart: 1,
  railHeight: 2,
  scrollSpan: 1,
  viewportHeight: 1,
  viewportWidth: 1,
};

function clamp(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

/**
 * A pixel of rail past the last project, so the seam below it is never on
 * screen while a project is.
 *
 * The last stop used to land exactly on the boundary between this rail and the
 * contact section, which left no room at all for the rounding every scroll
 * does: a page can only rest on a whole device pixel, while the rail's own
 * offset is fractional, being built out of `svh` units and a measured box. The
 * few tenths left over were enough to lift the boundary above the foot of the
 * screen, and what showed through was the head of the contact section, whose
 * ground is cream. On a black screen that reads as a pale line ruled across the
 * bottom. Measured over viewport heights from 900 to 960, nine of twenty one
 * drew it.
 *
 * It costs a pixel of scroll and nothing else. `scrollSpan` is the same
 * denominator the scroll progress is divided by, so the distance travelled at
 * any given position is unchanged and every project still centres exactly where
 * it did.
 */
const SCENE_TAIL = 1;

function measureScene(
  stackHeight: number,
  projectCount: number,
): SceneGeometry {
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const handoffStart = Math.max(
    0,
    stackHeight - viewportHeight - viewportHeight * STACK_PIN_DROP,
  );
  const projectsStart = handoffStart + viewportHeight;
  const projectSpan = Math.max(1, projectCount - 1) * viewportHeight;
  const railHeight =
    projectsStart + Math.max(1, projectCount) * viewportHeight + SCENE_TAIL;

  return {
    handoffStart,
    projectSpan,
    projectsStart,
    railHeight,
    scrollSpan: railHeight - viewportHeight,
    viewportHeight,
    viewportWidth,
  };
}

/**
 * One scroll owner for the whole Stack → Projects sequence.
 *
 * The stack first travels vertically inside the held viewport. Once its final
 * composition is framed, the two full-width panels move as one 200vw strip.
 * Projects then keeps the viewport while its own stops advance. There is no
 * negative-margin synchronization and no cross-section z-index to drift.
 */
export function StackProjectsScene({
  groups,
  items,
  projects,
}: StackProjectsSceneProps) {
  const reduceMotion = useReducedMotionPreference();
  // The server always renders the static responsive branch. The first client
  // render must match it exactly; the media-query effect selects the shared
  // desktop scene immediately after hydration. Reading `window` in this state
  // initializer made React discard the complete Stack + Projects subtree.
  const [onDesktop, setOnDesktop] = useState(false);
  const [geometry, setGeometry] = useState(initialGeometry);
  const railRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY);
    const sync = () => setOnDesktop(query.matches);

    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const stack = stackRef.current;
    if (!stack || !onDesktop || reduceMotion) return;

    const measure = () => {
      setGeometry(
        measureScene(stack.getBoundingClientRect().height, projects.length),
      );
    };

    measure();
    window.addEventListener('resize', measure);
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(measure);
    observer?.observe(stack);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [onDesktop, projects.length, reduceMotion]);

  const { scrollYProgress: railProgress } = useScroll({
    target: onDesktop && !reduceMotion ? railRef : undefined,
    offset: ['start start', 'end end'],
  });
  const smoothProgress = useSpring(railProgress, STACK_SLIDE_SPRING);
  const rawDistance = useTransform(
    railProgress,
    (progress) => progress * geometry.scrollSpan,
  );
  const distance = useTransform(
    smoothProgress,
    (progress) => progress * geometry.scrollSpan,
  );
  /**
   * Keep the established spring while Projects enters, but do not let that
   * spring trail behind the page on the return journey. On the way down the
   * smoothed distance is smaller than the raw one; on the way up the raw
   * distance is smaller. Taking the smaller value therefore preserves the
   * animated entrance and makes the reverse handoff finish before Stack's
   * direct vertical movement resumes.
   */
  const handoffDistance = useTransform(() =>
    Math.min(rawDistance.get(), distance.get()),
  );
  const stackY = useTransform(
    rawDistance,
    (travelled) => -Math.min(travelled, geometry.handoffStart),
  );
  const arrival = useTransform(handoffDistance, (travelled) =>
    clamp((travelled - geometry.handoffStart) / geometry.viewportHeight),
  );
  const trackX = useTransform(
    arrival,
    (progress) => -progress * geometry.viewportWidth,
  );
  const projectProgress = useTransform(rawDistance, (travelled) =>
    clamp((travelled - geometry.projectsStart) / geometry.projectSpan),
  );

  useProjectSnap(projects.length, {
    arrival,
    enabled: onDesktop && !reduceMotion,
    markersRef,
    railRef,
    scrollYProgress: projectProgress,
  });

  if (!onDesktop) {
    return (
      <>
        <StackSection groups={groups} items={items} staticLayout />
        <ProjectsSection mobileOnly projects={projects} />
      </>
    );
  }

  if (reduceMotion) {
    return (
      <>
        <StackSection groups={groups} items={items} />
        <ProjectsSection projects={projects} />
      </>
    );
  }

  return (
    <div
      className="relative z-10 -mt-[100svh] bg-ink"
      data-testid="stack-projects-scene"
      ref={railRef}
      style={{ height: geometry.railHeight }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        data-testid="stack-slide-rail"
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0"
        data-scroll-anchor="true"
        id="stack"
        style={{ height: geometry.projectsStart }}
      />
      <div
        className="pointer-events-none absolute inset-x-0"
        data-scroll-anchor="true"
        data-testid="desktop-project-stage"
        id="projects"
        style={{
          height: Math.max(1, projects.length) * geometry.viewportHeight,
          top: geometry.projectsStart,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 h-px"
        data-testid="stack-projects-handoff-start"
        style={{ top: geometry.handoffStart }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0"
        ref={markersRef}
        style={{ top: geometry.projectsStart }}
      >
        {projects.map((project) => (
          <div
            className="h-svh"
            data-testid="project-marker"
            key={project.slug}
          />
        ))}
      </div>

      <div className="sticky top-0 h-svh overflow-hidden bg-ink">
        <motion.div
          className="flex h-svh w-[200vw] will-change-transform"
          style={{ x: trackX }}
        >
          <div
            className="relative h-svh w-screen shrink-0 overflow-hidden bg-ink"
            data-testid="stack-scene-panel"
          >
            <StackPanel
              className="absolute inset-x-0 top-0 w-full"
              groups={groups}
              items={items}
              reduceMotion={false}
              sectionRef={stackRef}
              style={{ y: stackY }}
            />
          </div>

          <div
            className="h-svh w-screen shrink-0 overflow-hidden bg-ink"
            data-testid="projects-scene-panel"
          >
            <ProjectsSection
              projects={projects}
              sceneProgress={projectProgress}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
