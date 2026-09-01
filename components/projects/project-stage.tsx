"use client";

import { AnimatePresence, motion } from "motion/react";

import type { Project } from "@/content/portfolio";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";
import { ProjectArt } from "./project-art";

type ProjectStageProps = {
  activeIndex: number;
  projects: Project[];
};

export function ProjectStage({ activeIndex, projects }: ProjectStageProps) {
  const reduceMotion = useReducedMotionPreference();
  const project = projects[activeIndex];

  if (!project) return null;

  const transition = reduceMotion ? { duration: 0 } : { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const };
  const headingId = `desktop-project-${project.slug}-title`;

  return (
    <div className="grid h-full min-h-0 grid-cols-12 gap-8 py-6 xl:py-10">
      <div className="col-span-1 flex flex-col justify-center gap-4" aria-hidden="true">
        {projects.map((item, index) => (
          <div key={item.slug} className="flex items-center gap-3 text-[0.58rem] tracking-[0.14em]">
            <motion.span animate={{ opacity: index === activeIndex ? 1 : 0.25 }} transition={transition}>{item.index}</motion.span>
            <motion.span
              className="block h-px bg-paper"
              animate={{ opacity: index === activeIndex ? 1 : 0.25, width: index === activeIndex ? 34 : 12 }}
              transition={transition}
            />
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.article
          key={project.slug}
          aria-labelledby={headingId}
          className="col-span-11 grid h-full min-h-0 grid-cols-12 overflow-y-auto overscroll-contain border border-white/15 bg-graphite"
          initial={reduceMotion ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
          transition={transition}
        >
          <ProjectArt className="col-span-7 h-full" direction={project.artDirection} title={project.title} />
          <div className="col-span-5 grid content-between p-[clamp(2rem,4vw,4.5rem)]">
            <div className="flex justify-between text-label uppercase text-muted">
              <span>[ {project.index} ]</span><span>{project.year}</span>
            </div>
            <div>
              <p className="text-label uppercase text-muted">{project.role}</p>
              <h3 id={headingId} className="mt-5 font-serif text-[clamp(4.25rem,7vw,8.5rem)] leading-[0.78] tracking-[-0.065em]">{project.title}</h3>
              <p className="mt-9 max-w-md text-base leading-relaxed text-muted">{project.summary}</p>
              <ul aria-label={`${project.title} technologies`} className="mt-8 flex flex-wrap gap-2">
                {project.stack.map((technology) => (
                  <li key={technology} className="rounded-full border border-white/15 px-3 py-2 text-label uppercase text-muted">{technology}</li>
                ))}
              </ul>
            </div>
            <div className="flex items-end justify-between gap-5 text-label uppercase">
              {project.href ? (
                <a className="focus-ring border-b border-white/40 pb-1" href={project.href}>View case study ↗</a>
              ) : (
                <span className="text-muted">Case study / Soon</span>
              )}
              <span className="text-muted">{project.index} / {String(projects.length).padStart(2, "0")}</span>
            </div>
          </div>
        </motion.article>
      </AnimatePresence>
    </div>
  );
}
