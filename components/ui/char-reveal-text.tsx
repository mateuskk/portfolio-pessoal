'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, stagger, type Variants } from 'motion/react';

import { useIntroReady } from '@/hooks/use-intro-ready';
import { useReducedMotionPreference } from '@/hooks/use-reduced-motion-preference';
import { easeOutExpo, scrollRevealViewport } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useLanguage } from "@/components/providers/language-provider";

type CharRevealTextProps = {
  children: string;
  className?: string;
  as?: 'span' | 'div' | 'p';
  delay?: number;
  trigger?: 'viewport' | 'intro';
};

export const CHAR_REVEAL_STAGGER = 0.05;
export const CHAR_REVEAL_DURATION = 0.85;

const charVariants: Variants = {
  hidden: { opacity: 0, y: '100%' },
  visible: {
    opacity: 1,
    y: '0%',
    transition: { duration: CHAR_REVEAL_DURATION, ease: easeOutExpo },
  },
};

function getCharContainerVariants(delay: number): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        delayChildren: stagger(CHAR_REVEAL_STAGGER, { startDelay: delay }),
      },
    },
  };
}

export function getCharRevealFinishDelay(text: string, startDelay = 0) {
  const charCount = text.replace(/\s+/g, '').length;
  return (
    startDelay + Math.max(charCount - 1, 0) * CHAR_REVEAL_STAGGER + CHAR_REVEAL_DURATION
  );
}

/**
 * Delay for a second text to start once the stagger of a preceding
 * CharRevealText has moved through its characters, without waiting for
 * that text's full rise animation to settle — keeps the two feeling
 * like one continuous sequence instead of two separate beats.
 */
export function getCharRevealSequenceDelay(text: string, startDelay = 0) {
  const charCount = text.replace(/\s+/g, '').length;
  return startDelay + Math.max(charCount - 1, 0) * CHAR_REVEAL_STAGGER;
}

export function CharRevealText({
  children,
  className,
  as = 'span',
  delay = 0,
  trigger = 'viewport',
}: CharRevealTextProps) {
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const introReady = useIntroReady();
  const reduceMotion = useReducedMotionPreference();
  const containerVariants = useMemo(() => getCharContainerVariants(delay), [delay]);
  const words = useMemo(() => children.split(/(\s+)/), [children]);

  useEffect(() => setMounted(true), []);

  const staticClassName = cn('block', className);
  if (reduceMotion || (trigger === 'viewport' && !mounted)) {
    const StaticElement = as;
    return <StaticElement className={staticClassName}>{children}</StaticElement>;
  }

  const MotionElement = motion[as];
  const Wrapper = as === 'span' ? 'span' : 'div';
  const revealProps =
    trigger === 'intro'
      ? { animate: introReady ? 'visible' : 'hidden' }
      : { whileInView: 'visible', viewport: scrollRevealViewport };

  return (
    <Wrapper className="block overflow-hidden py-[0.18em] -my-[0.18em]">
      <MotionElement
        key={language}
        className={staticClassName}
        initial="hidden"
        variants={containerVariants}
        {...revealProps}
      >
        {words.map((word, wordIndex) =>
          word.trim() === '' ? (
            word
          ) : (
            <span key={wordIndex} className="inline-block whitespace-pre-wrap">
              {word.split('').map((char, charIndex) => (
                <motion.span
                  key={charIndex}
                  className="inline-block"
                  variants={charVariants}
                >
                  {char}
                </motion.span>
              ))}
            </span>
          ),
        )}
      </MotionElement>
    </Wrapper>
  );
}
