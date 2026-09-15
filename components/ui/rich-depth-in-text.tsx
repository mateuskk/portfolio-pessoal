'use client';

import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion, type Variants } from 'motion/react';

import {
  RICH_TEXT_EMPHASIS_CLASS,
  renderRichText,
  tokenizeRichText,
  type RichTextToken,
} from '@/components/ui/rich-text';
import { useReducedMotionPreference } from '@/hooks/use-reduced-motion-preference';
import {
  CHAR_STAGGER_MAX,
  CHAR_SWEEP_BUDGET,
  easeOutCubic,
} from '@/lib/motion';
import { useLanguage } from "@/components/providers/language-provider";

type RichDepthInTextProps = {
  children: string;
  className?: string;
  as?: 'span' | 'div' | 'p' | 'h3';
  delay?: number;
  active?: boolean;
  'data-testid'?: string;
};

const FOLD_REVEAL_DURATION = 1;
const FOLD_HIDE_DURATION = 0.28;
const containerVariants: Variants = { hidden: {}, visible: {} };

function countChars(tokens: RichTextToken[]) {
  return tokens.reduce(
    (total, token) => total + token.text.replace(/\s+/g, '').length,
    0,
  );
}

/**
 * GSAP's `from: "center"` reveals the two middle characters together on an
 * even-length line, then moves symmetrically toward both edges.
 */
function getCenterOrder(index: number, count: number) {
  const centre = (count - 1) / 2;
  const halfStep = count % 2 === 0 ? 0.5 : 0;
  return Math.abs(index - centre) - halfStep;
}

function getCenterStagger(count: number) {
  const furthestOrder = Math.max(Math.floor((count - 1) / 2), 1);
  return Math.min(CHAR_STAGGER_MAX, CHAR_SWEEP_BUDGET / furthestOrder);
}

function getCharacterVariants(
  delay: number,
  stagger: number,
  characterCount: number,
): Variants {
  return {
    hidden: {
      opacity: 0,
      rotateX: -80,
      transition: { duration: FOLD_HIDE_DURATION, ease: easeOutCubic },
    },
    visible: (index: number) => ({
      opacity: 1,
      rotateX: 0,
      transition: {
        duration: FOLD_REVEAL_DURATION,
        ease: easeOutCubic,
        delay: delay + getCenterOrder(index, characterCount) * stagger,
      },
    }),
  };
}

/**
 * Animation 2 from the selected reference: characters fold forward from
 * -80deg on the X axis, opening from the centre toward both edges. The source
 * uses a flat 0.05s stagger; this adaptation keeps that rhythm on short copy
 * and caps the sweep on a longer portfolio statement.
 */
export function RichDepthInText({
  children,
  className,
  as = 'p',
  delay = 0,
  active = true,
  'data-testid': testId,
}: RichDepthInTextProps) {
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotionPreference();
  const tokens = useMemo(() => tokenizeRichText(children), [children]);
  const characterCount = useMemo(() => countChars(tokens), [tokens]);
  const stagger = useMemo(
    () => getCenterStagger(characterCount),
    [characterCount],
  );
  const characterVariants = useMemo(
    () => getCharacterVariants(delay, stagger, characterCount),
    [characterCount, delay, stagger],
  );

  useEffect(() => setMounted(true), []);

  if (reduceMotion || !mounted) {
    const StaticElement = as;
    return (
      <StaticElement
        className={className}
        data-animation="center-fold-reveal"
        data-testid={testId}
      >
        {renderRichText(children)}
      </StaticElement>
    );
  }

  const MotionElement = motion[as];
  let characterIndex = 0;

  const renderTokenText = (token: RichTextToken): ReactNode[] =>
    token.text.split(/(\s+)/).map((segment, segmentIndex) => {
      if (segment.trim() === '') return segment;

      return (
        <span key={segmentIndex} className="inline-block whitespace-pre-wrap">
          {segment.split('').map((character, index) => {
            const currentIndex = characterIndex;
            characterIndex += 1;

            return (
              <motion.span
                aria-hidden="true"
                className="inline-block"
                custom={currentIndex}
                data-fold-character="true"
                key={index}
                style={{
                  transformOrigin: '50% 50%',
                  transformStyle: 'preserve-3d',
                }}
                variants={characterVariants}
              >
                {character}
              </motion.span>
            );
          })}
        </span>
      );
    });

  return (
    <MotionElement
        key={language}
      animate={active ? 'visible' : 'hidden'}
      aria-label={tokens.map((token) => token.text).join('')}
      className={className}
      data-animation="center-fold-reveal"
      data-testid={testId}
      initial="hidden"
      style={{ perspective: '900px', transformStyle: 'preserve-3d' }}
      variants={containerVariants}
    >
      {tokens.map((token, index) => {
        const content = renderTokenText(token);

        if (token.emphasis === 'strong') {
          return (
            <strong key={index} className={RICH_TEXT_EMPHASIS_CLASS.strong}>
              {content}
            </strong>
          );
        }

        if (token.emphasis === 'em') {
          return (
            <em key={index} className={RICH_TEXT_EMPHASIS_CLASS.em}>
              {content}
            </em>
          );
        }

        return <Fragment key={index}>{content}</Fragment>;
      })}
    </MotionElement>
  );
}
