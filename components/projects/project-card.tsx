import type { Project } from "@/content/portfolio";
import { cn } from "@/lib/utils";
import { ProjectRepositoryLink } from "./project-repository-link";
import { ProjectShot } from "./project-shot";
import { ProjectTechnologyList } from "./project-technology-list";

type ProjectCardProps = {
  project: Project;
  active: boolean;
  className?: string;
};

export function ProjectCard({ project, active, className }: ProjectCardProps) {
  const headingId = `project-${project.slug}-title`;

  return (
    <article
      aria-current={active ? "true" : undefined}
      aria-labelledby={headingId}
      className={cn("grid shrink-0 snap-center border border-white/15 bg-graphite", className)}
    >
      <ProjectShot project={project} />
      <div className="border-t border-white/15 px-6 py-4 sm:px-8">
        <ProjectRepositoryLink href={project.repository} title={project.title} />
      </div>
      <div className="grid content-between p-6 pt-4 sm:p-8 sm:pt-5">
        <div>
          <h3 id={headingId} className="font-serif text-5xl leading-[0.92] tracking-[-0.055em] sm:text-6xl">{project.title}</h3>
          <p className="mt-5 text-sm uppercase tracking-[0.14em] text-paper/70">{project.role}</p>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">{project.summary}</p>
          <ProjectTechnologyList
            className="mt-7"
            projectTitle={project.title}
            technologies={project.stack}
          />
        </div>
      </div>
    </article>
  );
}
