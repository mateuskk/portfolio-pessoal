'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';

import { useIntroReady } from '@/hooks/use-intro-ready';
import { useReducedMotionPreference } from '@/hooks/use-reduced-motion-preference';
import { blurInChar, getBlurInContainer, scrollRevealViewport } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useLanguage } from "@/components/providers/language-provider";

type BlurInTextProps = {
  children: string;
  className?: string;
  as?: 'span' | 'div' | 'p';
  delay?: number;
  trigger?: 'viewport' | 'intro';
};

export function BlurInText({
  children,
  className,
  as = 'p',
  delay = 0,
  trigger = 'viewport',
}: BlurInTextProps) {
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const introReady = useIntroReady();
  const reduceMotion = useReducedMotionPreference();
  const containerVariants = useMemo(() => getBlurInContainer(delay), [delay]);
  const words = useMemo(() => children.split(/(\s+)/), [children]);

  useEffect(() => setMounted(true), []);

  if (reduceMotion || (trigger === 'viewport' && !mounted)) {
    const StaticElement = as;
    return <StaticElement className={className}>{children}</StaticElement>;
  }

  const MotionElement = motion[as];
  const revealProps =
    trigger === 'intro'
      ? { animate: introReady ? 'visible' : 'hidden' }
      : { whileInView: 'visible', viewport: scrollRevealViewport };

  return (
    <MotionElement
        key={language}
      className={cn(className)}
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
                variants={blurInChar}
              >
                {char}
              </motion.span>
            ))}
          </span>
        ),
      )}
    </MotionElement>
  );
}
