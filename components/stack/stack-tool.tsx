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
            ? // `rounded-none` because the shared radius is a token this project
              // redefines: `rounded-sm` lands at 7.2px, and on a chip this
              // short that curls both ends of the bottom border upward into
              // little hooks. The stack variant draws no border and keeps it.
              'relative gap-2 rounded-none border-b border-white/15 pb-2 text-xs uppercase tracking-[0.12em] text-paper/70'
            : 'gap-3 text-lg tracking-[-0.02em] sm:text-xl',
        )}
        data-testid="stack-tool"
        tabIndex={focusable ? undefined : -1}
      >
        {/*
          The chip's own rule, lit rather than answered with a second line.

          A hairline used to wipe in under the name on hover. That is the stack
          panel's vocabulary and reads correctly there, but here it landed a few
          pixels above a rule the chip already carries, so hovering one drew two
          lines where the design has one. This lights the rule that is already
          there: a one-pixel bar sitting exactly on the border, carrying both a
          lit colour and the halo around it.

          It paints over the border rather than recolouring it, because
          recolouring does not work on this page. `globals.css` sets
          `border-color` on `*` outside any cascade layer, and unlayered styles
          beat layered ones whatever their specificity, so every Tailwind
          border-colour utility loses to it. That is worth fixing on its own
          terms one day, and is not this chip's business.

          A gradient band rather than a shadow around a hairline. A shadow
          surrounds the box it is cast from, so on a one-pixel bar it curled
          around both ends and drew a small hook rising at each edge. A band
          shares the rule's own left and right edges and fades only up and
          down, so it has no ends to curl. Weighted downward, away from the
          name: the core sits on the border at 30% of the band's height, which
          leaves three pixels of falloff above and six below.

          Painted rather than filtered, so forty-odd chips on one project cost
          no blur.
        */}
        {project && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -bottom-[7px] h-[10px] bg-[linear-gradient(to_bottom,transparent_0%,var(--paper)_30%,var(--paper)_40%,transparent_100%)] opacity-0 transition-opacity duration-500 ease-(--ease-weighted) group-hover/tool:opacity-45 group-focus-visible/tool:opacity-45"
          />
        )}
        <TechnologyIcon
          className={cn(
            'transition-transform duration-300 ease-(--ease-weighted) group-hover/tool:scale-115 group-focus-visible/tool:scale-115',
            project && 'size-4',
          )}
          icon={item.icon}
        />
        <span className="relative">
          {item.name}
          {/* Wipes in from the left on hover, the same hairline vocabulary the
              rest of the section is drawn with. The project chips leave it to
              the rule they already sit on, which is why this is the stack's
              alone. */}
          {!project && (
            <span
              aria-hidden="true"
              className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-current transition-transform duration-500 ease-(--ease-weighted) group-hover/tool:scale-x-100 group-focus-visible/tool:scale-x-100"
            />
          )}
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
