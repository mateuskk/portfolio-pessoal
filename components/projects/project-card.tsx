import type { Project } from "@/content/portfolio";
import { cn } from "@/lib/utils";
import { ProjectArt } from "./project-art";

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
      <ProjectArt direction={project.artDirection} title={project.title} />
      <div className="grid content-between gap-12 p-6 sm:p-8">
        <div className="flex items-start justify-between gap-5 text-label uppercase text-muted-foreground">
          <span>{project.index}</span>
          <span>{project.year}</span>
        </div>
        <div>
          <h3 id={headingId} className="font-serif text-5xl leading-none tracking-[-0.055em] sm:text-6xl">{project.title}</h3>
          <p className="mt-4 text-sm uppercase tracking-[0.14em] text-muted-foreground">{project.role}</p>
          <p className="mt-7 max-w-lg leading-relaxed text-muted-foreground">{project.summary}</p>
          <ul aria-label={`${project.title} technologies`} className="mt-7 flex flex-wrap gap-2">
            {project.stack.map((technology) => (
              <li key={technology} className="rounded-full border border-white/15 px-3 py-2 text-label uppercase text-muted-foreground">{technology}</li>
            ))}
          </ul>
          {project.href ? (
            <a className="focus-ring mt-9 inline-block border-b border-white/40 pb-1 text-label uppercase tracking-[0.16em]" href={project.href}>View case study ↗</a>
          ) : (
            <span className="mt-9 inline-block text-label uppercase tracking-[0.16em] text-muted-foreground">Case study / Soon</span>
          )}
        </div>
      </div>
    </article>
  );
}
