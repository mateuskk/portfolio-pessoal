'use client';

import { useState, type CSSProperties } from 'react';
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  type MotionValue,
} from 'motion/react';

import { HangingBadge } from '@/components/about/hanging-badge';
import { RichBlurInText } from '@/components/ui/rich-blur-in-text';
import { RichDepthInText } from '@/components/ui/rich-depth-in-text';
import type { PortfolioContent } from '@/content/portfolio';
import { mapRange } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useCopy } from "@/components/providers/language-provider";

/**
 * The about copy sits above the split panels in the stacking order, over a
 * wrapper that is deliberately transparent, so anything that renders before the
 * paper has reached it is dark-on-dark. The panels open from the centre, which
 * means the section becomes safe top-down rather than all at once — measured
 * against the paper band, the heading clears at ~0.70 and the statement at
 * ~0.78, while the lower blocks are only covered at ~0.96.
 *
 * So the reveal runs in two stages instead of waiting for one late gate: the
 * headline content starts as soon as it is genuinely on paper, and the lower
 * blocks follow when the split finishes.
 */
const ABOUT_HEAD_ENTER = 0.78;
const ABOUT_HEAD_EXIT = 0.68;
const ABOUT_BODY_ENTER = 0.96;
const ABOUT_BODY_EXIT = 0.88;

/**
 * Within a stage the blocks are spaced far enough apart to land one at a time.
 * A block's sweep runs for `CHAR_SWEEP_BUDGET` seconds, so these delays have to
 * clear that to read as a cascade rather than a single flash.
 */
const HEAD_STATEMENT_DELAY = 0.18;
const BODY_LEAD_DELAY = 0.8;
const BODY_PARAGRAPH_STEP = 0.7;

/**
 * The badge leaves ahead of the stack, on its own clock.
 *
 * The copy can afford to sit there until the section fades, because the rising
 * stack edge meets it as a line of text and passes through. The badge cannot:
 * it is a solid pale card, the lowest thing in the column, so the edge cuts it
 * in half and leaves a bright stub perched on the seam — visible right up until
 * the section fade finally catches up.
 *
 * Measured on the pin rail at 1440x900: the stack's top edge crosses into view
 * at ~0.43, first touches the card's bottom at ~0.59, and has covered it by
 * ~0.76. So the card goes as the edge appears and is gone by 0.56 — with the
 * edge still some 40px below it, which is the margin that keeps a stub from
 * ever forming.
 *
 * Deliberately *not* applied to the copy: pulling the text early would leave
 * the section half-empty through the hold.
 */
const BADGE_EXIT_START = 0.44;
const BADGE_EXIT_END = 0.56;

/** Below this the card is invisible, so it must stop taking the pointer too. */
const BADGE_INTERACTIVE_FLOOR = 0.05;

/**
 * Where the card joins the page on the way in, as a share of the split.
 *
 * It used to arrive on the same boolean gate as the body copy, which meant it
 * appeared at whatever opacity its own entrance had reached and vanished the
 * same way going back up. The card is not a line of text: it hangs off a cord
 * that reaches above the section's own top edge, deliberately unclipped, so
 * while the split is still running it is the one element that can be drawn
 * across the seam. Riding the transition instead of flipping on it means it is
 * simply not there to cross anything until the transition has finished.
 *
 * The window sits at the very end of the split, later than the copy's own gate:
 * the card is the last thing to arrive and the first to go. Asked twice to make
 * it leave sooner, which is what these two numbers are for, and raising them is
 * the whole adjustment — a higher window means a later arrival going down and
 * an earlier exit coming back up.
 */
const BADGE_ARRIVE_START = 0.94;
const BADGE_ARRIVE_END = 0.999;

function nextGate(current: boolean, latest: number, enter: number, exit: number) {
  if (!current && latest >= enter) return true;
  if (current && latest <= exit) return false;
  return current;
}

type AboutSectionProps = {
  content: PortfolioContent['about'] &
    Pick<PortfolioContent['person'], 'name' | 'initials' | 'role' | 'portrait'>;
  tone?: 'dark' | 'paper';
  /**
   * Set when the section is held in a pinned viewport-height frame. Its own
   * vertical padding is dropped so the wrapper can centre the copy instead:
   * the section is ~828px tall, which does not fit the 768–800px viewports of
   * common laptops, and pinning it with that padding would push the last
   * paragraph below the fold with no way to scroll to it.
   */
  pinned?: boolean;
  /**
   * Progress of the hero split transition. When supplied, the copy stays
   * hidden until the paper has covered its part of the screen and un-reveals
   * when the transition is scrolled back up. Omitted (reduced motion,
   * standalone rendering) means "already revealed".
   */
  splitProgress?: MotionValue<number>;
  /**
   * Progress of the about→stack handover. Supplied only when the section is
   * pinned; it drives the badge out before the stack edge reaches it. Omitted
   * means "no handover", and the badge simply stays.
   */
  handoverProgress?: MotionValue<number>;
};

export function AboutSection({
  content,
  tone = 'dark',
  pinned = false,
  splitProgress,
  handoverProgress,
}: AboutSectionProps) {
  const copy = useCopy();
  const paper = tone === 'paper';

  const restingProgress = useMotionValue(1);
  const transitionProgress = splitProgress ?? restingProgress;

  /**
   * Held on a wrapper of its own rather than passed into `HangingBadge`. The
   * badge already animates its own `opacity` on entrance, and two owners of one
   * property means whichever wrote last wins — the card would flicker back in
   * as the entrance settled. An outer layer composes instead of competing.
   */
  const restingHandover = useMotionValue(0);
  const handover = handoverProgress ?? restingHandover;
  /**
   * One value, two jobs: arriving with the split and leaving with the stack.
   *
   * Multiplied rather than applied on two layers, because whichever wrote last
   * would win and the card would flicker between them.
   */
  const badgeExitOpacity = useTransform(
    () =>
      mapRange(handover.get(), BADGE_EXIT_START, BADGE_EXIT_END, 1, 0) *
      mapRange(
        transitionProgress.get(),
        BADGE_ARRIVE_START,
        BADGE_ARRIVE_END,
        0,
        1,
      ),
  );
  const badgeExitPointer = useTransform(badgeExitOpacity, (value) =>
    value < BADGE_INTERACTIVE_FLOOR ? 'none' : 'auto',
  );
  const ungated = splitProgress === undefined;
  const [headRevealed, setHeadRevealed] = useState(ungated);
  const [bodyRevealed, setBodyRevealed] = useState(ungated);

  useMotionValueEvent(transitionProgress, 'change', (latest) => {
    setHeadRevealed((current) =>
      nextGate(current, latest, ABOUT_HEAD_ENTER, ABOUT_HEAD_EXIT),
    );
    setBodyRevealed((current) =>
      nextGate(current, latest, ABOUT_BODY_ENTER, ABOUT_BODY_EXIT),
    );
  });

  return (
    <section
      id="about"
      aria-labelledby="about-title"
      data-tone={tone}
      data-revealed={String(headRevealed)}
      data-body-revealed={String(bodyRevealed)}
      /*
        Deliberately not clipped. The badge hangs on a cord that stretches
        when it is pulled, so a hard drag downwards carries the card past the
        section's own box — measured at 81px past it on a 1440x900 laptop,
        which read as a band of background sliced across the card.
        Containing the swing is not this element's job anyway: `main` carries
        `overflow-clip`, which is what actually stops a sideways drag from
        widening the page, and the pinned frame clips at the viewport edge.
      */
      className={cn(
        'px-page',
        pinned ? 'w-full py-0' : 'py-20 sm:py-28 lg:py-36',
        paper ? 'text-ink' : 'border-t border-white/15',
      )}
      style={
        {
          // Emphasis colours for `renderRichText`. Bold advances to the full
          // tone colour, italic recedes — set here because the classes are
          // shared and cannot know which tone they are rendering into.
          '--rt-strong': paper ? 'var(--ink)' : 'var(--paper)',
          '--rt-em': paper ? 'rgb(9 9 9 / 0.68)' : 'rgb(243 241 234 / 0.68)',
        } as CSSProperties
      }
    >
      <div
        className="grid min-w-0 gap-y-14 lg:grid-cols-12 lg:gap-x-8 xl:gap-x-12"
        data-testid="about-layout"
      >
        <header className="min-w-0 lg:col-span-3">
          {/*
            `lg:z-10` is what keeps the dragged badge over the body copy.
            Sticky positioning already opens a stacking context, but at
            `z-index: auto`; the paragraphs carry a Motion `filter`, which per
            spec paints them as though they were positioned at `z-index: 0`.
            Same level, and they come later in the DOM — so without this they
            win, and the copy reads straight through the card.
          */}
          <div className="lg:sticky lg:top-28 lg:z-10">
            {/*
              No longer drawn, but it still names the section through
              `aria-labelledby` and holds the section's place in the document
              outline — so it stays in the DOM, visually hidden.
            */}
            <h2 className="sr-only" id="about-title">
              {copy.aboutHeading}
            </h2>

            <motion.div
              data-testid="about-badge-exit"
              style={{ opacity: badgeExitOpacity, pointerEvents: badgeExitPointer }}
            >
              <HangingBadge
                initials={content.initials}
                name={content.name}
                paper={paper}
                revealed={bodyRevealed}
                role={content.role}
                src={content.portrait}
              />
            </motion.div>
          </div>
        </header>

        <div
          className="min-w-0 lg:col-span-8 lg:col-start-5"
          data-testid="about-copy"
        >
          <RichDepthInText
            as="h3"
            active={headRevealed}
            data-testid="about-statement"
            delay={HEAD_STATEMENT_DELAY}
            /*
              The floor answers to the emphasis face, not to taste. It governs
              below 933px, where 4.2vw falls under it, and the phone is where
              this statement is tightest: the pin holds about 635px of copy in a
              667px screen. Fraunces sets the italic here, and it is wider than
              the serif it replaced, which took the statement from six lines to
              seven on a 390px screen and grew the section 41px, stranding the
              last paragraph below the fold. 2.4rem is the measured value that
              takes it back to six, and leaves the section at 658px, five
              shorter than it stood before the face changed. Desktop never sees
              it.
            */
            className="max-w-[24ch] font-sans text-[clamp(2.4rem,4.2vw,5rem)] font-light leading-[1.01] tracking-[-0.052em]"
          >
            {content.statement}
          </RichDepthInText>

          <div className="mt-12 grid max-w-[42rem] gap-6">
            {content.paragraphs.map((paragraph, index) => (
              <RichBlurInText
                as="p"
                active={bodyRevealed}
                className={cn(
                  'text-lg leading-[1.65] tracking-[-0.015em] sm:text-xl lg:text-[1.35rem]',
                  paper ? 'text-black/62' : 'text-muted-foreground',
                )}
                data-testid={index === 0 ? 'about-lead' : undefined}
                delay={BODY_LEAD_DELAY + index * BODY_PARAGRAPH_STEP}
                key={paragraph}
              >
                {paragraph}
              </RichBlurInText>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
