'use client';

import { Tooltip } from '@base-ui/react/tooltip';
import { motion } from 'motion/react';

import type { StackGroup } from '@/content/portfolio';
import { useReducedMotionPreference } from '@/hooks/use-reduced-motion-preference';
import {
  revealContainer,
  revealItem,
  scrollRevealViewport,
} from '@/lib/motion';
import { StackTool, TOOLTIP_DELAY_MS } from './stack-tool';
import { useCopy } from "@/components/providers/language-provider";

type StackGridProps = {
  groups: StackGroup[];
};

/**
 * The quiet half of the stack section. The rails above are expressive and
 * deliberately decorative — they shout a handful of names at display size and
 * carry no structure. This is the read: what the tools are grouped into, what
 * each group is for, and what each individual tool does.
 */
export function StackGrid({ groups }: StackGridProps) {
  const reduceMotion = useReducedMotionPreference();
  const copy = useCopy();

  return (
    <Tooltip.Provider delay={TOOLTIP_DELAY_MS}>
      <div className="px-page" data-testid="stack-grid">
        {/*
          No rule between the bands. Space does the separating instead, and it
          has to be given a little more of it than the rule needed — a divider
          lets rows sit close because the line is doing the work, so simply
          deleting it leaves the bands looking crowded rather than clean.
        */}
        {groups.map((group) => (
          <div
            className="grid gap-y-6 py-12 lg:grid-cols-12 lg:gap-x-8 lg:py-14"
            data-testid="stack-group"
            key={group.label}
          >
            {/*
              Sized to sit a clear step below the section title and a clear
              step above the tools, so the band reads as a heading with a list
              under it rather than a caption with a list beside it. Four
              columns is what the longest label ("AI & automation") needs to
              stay on one line at this size, down to the `lg` breakpoint.
            */}
            <h3 className="font-display text-[clamp(1.9rem,3vw,2.9rem)] font-medium leading-[1.05] tracking-[-0.045em] lg:col-span-4">
              {group.label}
            </h3>

            {/*
              `revealItem` slides in from the left, so the list has to be able
              to paint outside its own box for the duration — hence no clipping
              here. Its hidden state is 8% opacity rather than 0: if the reveal
              never runs the names are still faintly there instead of gone.
            */}
            <motion.ul
              aria-label={copy.groupTechnologies(group.label)}
              className="flex flex-wrap gap-x-8 gap-y-5 lg:col-span-8 lg:pt-2"
              initial={reduceMotion ? undefined : 'hidden'}
              variants={reduceMotion ? undefined : revealContainer}
              viewport={scrollRevealViewport}
              whileInView={reduceMotion ? undefined : 'visible'}
            >
              {group.items.map((item) => (
                <motion.li
                  key={item.name}
                  variants={reduceMotion ? undefined : revealItem}
                >
                  <StackTool item={item} />
                </motion.li>
              ))}
            </motion.ul>
          </div>
        ))}
      </div>
    </Tooltip.Provider>
  );
}
