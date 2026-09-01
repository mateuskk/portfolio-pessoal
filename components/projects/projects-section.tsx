"use client";

/* oxlint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex -- The carousel region is intentionally focusable for arrow-key navigation. */

import { useRef, useState, useSyncExternalStore, type KeyboardEvent, type UIEvent } from "react";

import { SectionHeading } from "@/components/ui/section-heading";
import type { Project } from "@/content/portfolio";
import { useProjectProgress } from "@/hooks/use-project-progress";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";
import { ProjectCard } from "./project-card";
import { ProjectStage } from "./project-stage";

type ProjectsSectionProps = {
  projects: Project[];
};

function useDesktopProjects() {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia("(min-width: 1024px)");
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(min-width: 1024px)").matches,
    () => false,
  );
}

export function ProjectsSection({ projects }: ProjectsSectionProps) {
  const { activeIndex, containerRef } = useProjectProgress(projects.length);
  const [mobileIndex, setMobileIndex] = useState(0);
  const railRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotionPreference();
  const desktop = useDesktopProjects();
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
    if (rail.clientWidth === 0) return;
    setMobileIndex(Math.min(lastIndex, Math.max(0, Math.round(rail.scrollLeft / rail.clientWidth))));
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
        <SectionHeading index="003" eyebrow="Projects" title="Selected work" />
      </div>

      <div className="hidden lg:block lg:h-[400vh]" aria-hidden={!desktop} inert={!desktop}>
        <div className="sticky top-0 h-screen overflow-hidden px-page">
          <ProjectStage activeIndex={activeIndex} projects={projects} />
        </div>
      </div>

      <div className="mt-16 lg:hidden" aria-hidden={desktop} inert={desktop}>
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
          <p aria-live="polite" className="text-label uppercase text-muted">
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
