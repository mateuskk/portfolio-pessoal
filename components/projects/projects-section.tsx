"use client";

/* oxlint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex -- The carousel region is intentionally focusable for arrow-key navigation. */

import { useRef, useState, type KeyboardEvent, type UIEvent } from "react";

import { SectionHeading } from "@/components/ui/section-heading";
import type { Project } from "@/content/portfolio";
import { useProjectProgress } from "@/hooks/use-project-progress";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";
import { ProjectCard } from "./project-card";
import { ProjectStage } from "./project-stage";

type ProjectsSectionProps = {
  projects: Project[];
};

type ProjectCardGeometry = Pick<HTMLElement, "offsetLeft" | "offsetWidth">;

export function findNearestProjectIndex(scrollLeft: number, viewportWidth: number, cards: ProjectCardGeometry[]) {
  if (cards.length === 0) return 0;

  const viewportCenter = scrollLeft + viewportWidth / 2;
  return cards.reduce((nearestIndex, card, index) => {
    const nearestCard = cards[nearestIndex];
    const cardDistance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - viewportCenter);
    const nearestDistance = Math.abs(nearestCard.offsetLeft + nearestCard.offsetWidth / 2 - viewportCenter);
    return cardDistance < nearestDistance ? index : nearestIndex;
  }, 0);
}

export function ProjectsSection({ projects }: ProjectsSectionProps) {
  const { activeIndex, containerRef } = useProjectProgress(projects.length);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotionPreference();
  const lastIndex = Math.max(0, projects.length - 1);

  const goToProject = (requestedIndex: number) => {
    const nextIndex = Math.min(lastIndex, Math.max(0, requestedIndex));
    setMobileIndex(nextIndex);
    const card = railRef.current?.children.item(nextIndex);
    if (card instanceof HTMLElement) {
      card.scrollIntoView?.({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest", inline: "center" });
    }
  };

  const updateFromScroll = (event: UIEvent<HTMLDivElement>) => {
    const rail = event.currentTarget;
    const cards = Array.from(rail.children).filter((card): card is HTMLElement => card instanceof HTMLElement);
    if (rail.clientWidth === 0 || cards.length === 0) return;
    setMobileIndex(Math.min(lastIndex, findNearestProjectIndex(rail.scrollLeft, rail.clientWidth, cards)));
  };

  const handleKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goToProject(mobileIndex + 1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goToProject(mobileIndex - 1);
    }
  };

  return (
    <section id="projects" className="border-t border-white/15 py-24 sm:py-28 lg:py-0" ref={containerRef}>
      <div className="px-page lg:hidden">
        <SectionHeading eyebrow="Projects" title="Selected work" />
      </div>

      <div className="hidden lg:block lg:h-[400vh]">
        <div className="sticky top-0 h-screen overflow-hidden px-page">
          <h2 className="sr-only">Selected work</h2>
          <div className={fallbackOpen
            ? "absolute left-[var(--page-gutter)] top-24 z-[80] max-h-[calc(100vh-7rem)] w-[min(34rem,calc(100vw-(var(--page-gutter)*2)))] overflow-auto border border-white/20 bg-ink p-6 text-paper"
            : "sr-only focus-within:not-sr-only focus-within:absolute focus-within:left-[var(--page-gutter)] focus-within:top-24 focus-within:z-[80] focus-within:max-h-[calc(100vh-7rem)] focus-within:w-[min(34rem,calc(100vw-(var(--page-gutter)*2)))] focus-within:overflow-auto focus-within:border focus-within:border-white/20 focus-within:bg-ink focus-within:p-6 focus-within:text-paper"}>
            <button
              aria-controls="projects-fallback-list"
              aria-expanded={fallbackOpen}
              className="focus-ring text-label uppercase"
              onClick={() => setFallbackOpen(true)}
              type="button"
            >
              Browse all selected projects
            </button>
            <ol aria-label="All selected projects" className="mt-6" id="projects-fallback-list">
              {projects.map((project) => (
                <li key={project.slug}>
                  <article>
                    <p>{project.role} / {project.year}</p>
                    <h3>{project.title}</h3>
                    <p>{project.summary}</p>
                    <p>{project.stack.join(", ")}</p>
                    {project.href ? <a href={project.href}>View {project.title} case study</a> : <span>Case study coming soon</span>}
                  </article>
                </li>
              ))}
            </ol>
          </div>
          <div aria-hidden="true" className="h-full">
            <ProjectStage activeIndex={activeIndex} decorative projects={projects} />
          </div>
        </div>
      </div>

      <div className="mt-16 lg:hidden">
        <section
          aria-label="Selected projects"
          aria-roledescription="carousel"
          className="focus-ring flex snap-x snap-mandatory gap-4 overflow-x-auto px-page pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onKeyDown={handleKeys}
          onScroll={updateFromScroll}
          ref={railRef}
          tabIndex={0}
        >
          {projects.map((project, index) => (
            <ProjectCard
              key={project.slug}
              active={index === mobileIndex}
              className="w-[calc(100vw-(var(--page-gutter)*2))] max-w-[46rem] grid-rows-[auto_1fr]"
              project={project}
            />
          ))}
        </section>

        <div className="mt-6 flex items-center justify-between px-page">
          <p aria-live="polite" className="text-label uppercase text-muted-foreground">
            Project {String(mobileIndex + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Previous project"
              className="focus-ring grid size-11 place-items-center rounded-full border border-white/20 disabled:cursor-not-allowed disabled:opacity-30"
              disabled={mobileIndex === 0}
              onClick={() => goToProject(mobileIndex - 1)}
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Next project"
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
