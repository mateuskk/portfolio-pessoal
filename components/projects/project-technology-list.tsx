'use client';

import { Tooltip } from '@base-ui/react/tooltip';

import { StackTool, TOOLTIP_DELAY_MS } from '@/components/stack/stack-tool';
import { getTechnologyMeta } from '@/lib/technology-catalog';
import { cn } from '@/lib/utils';
import { useCopy } from "@/components/providers/language-provider";

type ProjectTechnologyListProps = {
  projectTitle: string;
  technologies: string[];
  className?: string;
  /**
   * Set on the copy that only the eye reads — the desktop stage's column over
   * the slabs, which is `aria-hidden` because the same projects are spoken by
   * the list behind "Browse all selected projects".
   *
   * It buys back the pointer and gives up the keyboard, which is the trade the
   * column asks for. That column is `pointer-events-none` so that the slabs
   * crossing underneath stay draggable and selectable, and the chips inherited
   * it: hovering one did nothing at all — no lift, no panel. Re-enabling it on
   * the chips alone leaves the rest of the column transparent to the pointer
   * exactly as before.
   */
  decorative?: boolean;
};

export function ProjectTechnologyList({
  projectTitle,
  technologies,
  className,
  decorative = false,
}: ProjectTechnologyListProps) {
  const copy = useCopy();

  return (
    <Tooltip.Provider delay={TOOLTIP_DELAY_MS}>
      <ul
        aria-label={copy.projectTechnologies(projectTitle)}
        className={cn(
          'flex flex-wrap gap-x-5 gap-y-3',
          decorative && 'pointer-events-auto',
          className,
        )}
      >
        {technologies.map((technology) => (
          <li key={technology}>
            <span data-testid="project-technology-icon">
              <StackTool
                focusable={!decorative}
                item={getTechnologyMeta(technology)}
                variant="project"
              />
            </span>
          </li>
        ))}
      </ul>
    </Tooltip.Provider>
  );
}
