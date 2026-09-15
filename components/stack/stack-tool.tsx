'use client';

import { Tooltip } from '@base-ui/react/tooltip';

import type { StackItem } from '@/content/portfolio';
import { cn } from '@/lib/utils';
import { TechnologyIcon } from './technology-icon';

type StackToolProps = {
  item: StackItem;
  variant?: 'stack' | 'project';
  /**
   * Off for a copy that is already spoken elsewhere.
   *
   * The projects' desktop stage paints its text twice: once for the eye, in an
   * `aria-hidden` column over the slabs, and once for assistive technology, in
   * the list that opens from "Browse all selected projects". Left focusable,
   * the decorative copy added twenty tab stops inside that hidden subtree —
   * measured — which is both the `aria-hidden-focus` violation and twenty
   * stops that announce nothing.
   */
  focusable?: boolean;
};

/**
 * Long enough that sweeping the pointer across a row does not flash a panel
 * per tool, short enough that deliberately stopping on one feels immediate.
 *
 * Shared with the project chips so both lists answer to the pointer at the
 * same speed — two different delays would read as two different components.
 */
export const TOOLTIP_DELAY_MS = 140;

/**
 * One tool in the stack panel: its brand mark, its name, and a panel that
 * explains what it is.
 *
 * Built on the Base UI tooltip rather than a bare `onMouseEnter` so the panel
 * is reachable by keyboard and dismissable with Escape — there are twenty-odd
 * of these, and a hover-only affordance would put the whole explanation out of
 * reach for anyone not using a mouse. The trigger stays a real button for the
 * same reason.
 */
export function StackTool({
  item,
  variant = 'stack',
  focusable = true,
}: StackToolProps) {
  const project = variant === 'project';

  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        className={cn(
          'focus-ring group/tool flex cursor-default items-center rounded-sm transition-transform duration-300 ease-(--ease-weighted) hover:-translate-y-0.5 focus-visible:-translate-y-0.5',
          project
            ? 'gap-2 border-b border-white/15 pb-2 text-xs uppercase tracking-[0.12em] text-paper/70'
            : 'gap-3 text-lg tracking-[-0.02em] sm:text-xl',
        )}
        data-testid="stack-tool"
        tabIndex={focusable ? undefined : -1}
      >
        <TechnologyIcon
          className={cn(
            'transition-transform duration-300 ease-(--ease-weighted) group-hover/tool:scale-115 group-focus-visible/tool:scale-115',
            project && 'size-4',
          )}
          icon={item.icon}
        />
        <span className="relative">
          {item.name}
          {/* Wipes in from the left on hover — the same hairline vocabulary the
              rest of the section is drawn with. */}
          <span
            aria-hidden="true"
            className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-current transition-transform duration-500 ease-(--ease-weighted) group-hover/tool:scale-x-100 group-focus-visible/tool:scale-x-100"
          />
        </span>
      </Tooltip.Trigger>

      <Tooltip.Portal>
        <Tooltip.Positioner
          align="start"
          className="isolate z-50"
          side="top"
          sideOffset={12}
        >
          <Tooltip.Popup
            className="w-[min(20rem,calc(100vw-2rem))] origin-(--transform-origin) rounded-xl border border-white/15 bg-graphite p-4 shadow-2xl data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
            data-testid="stack-tool-panel"
          >
            <div className="flex items-center gap-2.5">
              <TechnologyIcon icon={item.icon} />
              <span className="text-label uppercase">{item.name}</span>
            </div>
            <p className="mt-3 text-sm leading-[1.6] text-muted-foreground">
              {item.description}
            </p>
            <Tooltip.Arrow className="size-2.5 -translate-y-[calc(50%+1px)] rotate-45 rounded-[2px] border-r border-b border-white/15 bg-graphite data-[side=bottom]:top-1 data-[side=top]:-bottom-2.5" />
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
