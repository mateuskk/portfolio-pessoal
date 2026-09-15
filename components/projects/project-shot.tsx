"use client";

import { useState } from "react";

import type { Project } from "@/content/portfolio";
import { cn } from "@/lib/utils";
import { ProjectArt } from "./project-art";

type ProjectShotProps = {
  project: Project;
  className?: string;
};

/**
 * The project's screenshot, or the generative art if it is not there.
 *
 * The fallback is on `error` rather than on a build-time check because the
 * screenshots live in `public/` and are dropped in by hand — a missing file
 * should look like a placeholder, not like a broken page.
 *
 * Held to 2:1 and centred in its column rather than filling it. The
 * screenshots are browser captures, around 2.1:1, and a column as tall as the
 * card croppped them to their middles — the page title cut off at both ends,
 * reading as a random zoom rather than a screenshot. 2:1 is close enough to
 * their own proportion to take about six percent off the width, and the one squarer capture in the set is a centred login card, so
 * losing a little of its head and foot costs nothing.
 *
 * Fitted rather than filled. Cropping to the box hid the ends of a 2.1:1
 * capture, and the whole point of a screenshot is that the whole interface is
 * in it. The frame stays 2:1 for every project, so the cards still match; what
 * varies is a band of the frame's own colour above or below.
 */
export function ProjectShot({ project, className }: ProjectShotProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={cn("flex items-center bg-ink", className)}>
      <div
        className="relative aspect-[2/1] w-full overflow-hidden border border-white/10"
        data-testid="project-shot"
      >
        {failed ? (
          <ProjectArt className="absolute inset-0 size-full" direction={project.artDirection} title={project.title} />
        ) : (
          // eslint-disable-next-line nextjs/no-img-element -- this app runs on vinext; next/image is not installed
          <img
            alt={`${project.title} — interface`}
            className="size-full object-contain object-center"
            data-testid="project-shot-image"
            // Decoded off the main thread. Four of these move together on the
            // projects stage, and decoding on it cost three dropped frames at the
            // start of the first pass through — with one screenshot in place.
            // Three more are coming.
            decoding="async"
            loading="lazy"
            onError={() => setFailed(true)}
            src={project.image}
          />
        )}
      </div>
    </div>
  );
}
