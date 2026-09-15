'use client';

import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion, type Variants } from 'motion/react';

import {
  RICH_TEXT_BODY_EMPHASIS_CLASS,
  renderRichText,
  tokenizeRichText,
  type RichTextToken,
} from '@/components/ui/rich-text';
import { useReducedMotionPreference } from '@/hooks/use-reduced-motion-preference';
import {
  CHAR_REVEAL_IN_DURATION,
  CHAR_REVEAL_OUT_DURATION,
  easeOutCubic,
  getCharStagger,
} from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useLanguage } from "@/components/providers/language-provider";

type RichBlurInTextProps = {
  children: string;
  className?: string;
  as?: 'span' | 'div' | 'p' | 'h3';
  delay?: number;
  /** Gate for the reveal. Reversible: closing it blurs the characters back out. */
  active?: boolean;
  'data-testid'?: string;
};

function getCharVariants(delay: number, stagger: number): Variants {
  return {
    hidden: {
      opacity: 0,
      filter: 'blur(5px)',
      transition: { duration: CHAR_REVEAL_OUT_DURATION, ease: easeOutCubic },
    },
    visible: (index: number) => ({
      opacity: 1,
      filter: 'blur(0px)',
      transition: {
        duration: CHAR_REVEAL_IN_DURATION,
        ease: easeOutCubic,
        delay: delay + index * stagger,
      },
      /**
       * Dropped to `none` once the sweep lands, and this is a performance fix,
       * not tidiness. `blur(0px)` is still a filter: every one of these
       * characters — several hundred across the statement and the paragraphs —
       * stays on the filtered rasterization path forever, and the about→stack
       * handover scales the whole block, which forces the lot to be re-rastered
       * every frame. Measured over that handover: 69 frames in two seconds with
       * the filter left on, 119 with it cleared, and the twelve frames over
       * 32ms became none.
       */
      transitionEnd: { filter: 'none' },
    }),
  };
}

const containerVariants: Variants = { hidden: {}, visible: {} };

function countChars(tokens: RichTextToken[]) {
  return tokens.reduce(
    (total, token) => total + token.text.replace(/\s+/g, '').length,
    0,
  );
}

/**
 * Per-character blur-in reveal that preserves the inline `**bold**` /
 * `_italic_` emphasis of the source string — the `<em>` and `<strong>`
 * elements survive the split, and the stagger index runs continuously across
 * their boundaries so the sweep reads as one pass over the whole sentence.
 *
 * Delays are set per character via `custom` rather than `delayChildren:
 * stagger(...)`, because the emphasis elements sit between the animating
 * parent and its character children and registration order through them is
 * not something to depend on.
 */
export function RichBlurInText({
  children,
  className,
  as = 'p',
  delay = 0,
  active = true,
  'data-testid': testId,
}: RichBlurInTextProps) {
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotionPreference();
  const tokens = useMemo(() => tokenizeRichText(children), [children]);
  const stagger = useMemo(() => getCharStagger(countChars(tokens)), [tokens]);
  const charVariants = useMemo(
    () => getCharVariants(delay, stagger),
    [delay, stagger],
  );

  useEffect(() => setMounted(true), []);

  // Render the plain markup until hydration so the copy is present and legible
  // without JavaScript, matching how BlurInText guards its viewport path.
  if (reduceMotion || !mounted) {
    const StaticElement = as;
    return (
      <StaticElement
        className={className}
        data-animation="blur-reveal"
        data-testid={testId}
      >
        {renderRichText(children, RICH_TEXT_BODY_EMPHASIS_CLASS)}
      </StaticElement>
    );
  }

  const MotionElement = motion[as];
  let charIndex = 0;

  const renderTokenText = (token: RichTextToken): ReactNode[] =>
    token.text.split(/(\s+)/).map((segment, segmentIndex) => {
      if (segment.trim() === '') return segment;

      return (
        <span key={segmentIndex} className="inline-block whitespace-pre-wrap">
          {segment.split('').map((char, index) => {
            const currentIndex = charIndex;
            charIndex += 1;

            return (
              <motion.span
                key={index}
                className="inline-block"
                custom={currentIndex}
                variants={charVariants}
              >
                {char}
              </motion.span>
            );
          })}
        </span>
      );
    });

  return (
    <MotionElement
        key={language}
      className={cn(className)}
      data-animation="blur-reveal"
      data-testid={testId}
      initial="hidden"
      animate={active ? 'visible' : 'hidden'}
      variants={containerVariants}
    >
      {tokens.map((token, index) => {
        const content = renderTokenText(token);

        if (token.emphasis === 'strong') {
          return (
            <strong key={index} className={RICH_TEXT_BODY_EMPHASIS_CLASS.strong}>
              {content}
            </strong>
          );
        }

        if (token.emphasis === 'em') {
          return (
            <em key={index} className={RICH_TEXT_BODY_EMPHASIS_CLASS.em}>
              {content}
            </em>
          );
        }

        return <Fragment key={index}>{content}</Fragment>;
      })}
    </MotionElement>
  );
}
