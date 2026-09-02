'use client';

import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  type MotionValue,
} from 'motion/react';

import { MagneticLink } from '@/components/ui/magnetic-link';
import { RevealText } from '@/components/ui/reveal-text';
import { useIntroReady } from '@/hooks/use-intro-ready';
import { useReducedMotionPreference } from '@/hooks/use-reduced-motion-preference';
import { easeOutExpo } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { PortfolioContent } from '@/content/portfolio';
import { HeroFallback } from './hero-fallback';

const LazyHeroScene = lazy(() =>
  import('./hero-scene').then((module) => ({ default: module.HeroScene })),
);

type HeroProps = {
  content: Pick<
    PortfolioContent['person'],
    'name' | 'role' | 'location' | 'availability'
  >;
  contained?: boolean;
  onVisualReady?: () => void;
  splitProgress?: MotionValue<number>;
};

class HeroSceneBoundary extends Component<
  { children: ReactNode; onFallback?: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    this.props.onFallback?.();
  }

  render() {
    return this.state.failed ? <HeroFallback /> : this.props.children;
  }
}

type HeroSceneMode = 'pending' | 'webgl' | 'fallback';

function useHeroSceneMode() {
  const [mode, setMode] = useState<HeroSceneMode>('pending');

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 768px)');
    const motionPreference = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    );
    const update = () => {
      const canRenderWebGL =
        desktop.matches &&
        !motionPreference.matches &&
        Boolean(window.WebGLRenderingContext);
      setMode(canRenderWebGL ? 'webgl' : 'fallback');
    };
    update();
    desktop.addEventListener('change', update);
    motionPreference.addEventListener('change', update);
    return () => {
      desktop.removeEventListener('change', update);
      motionPreference.removeEventListener('change', update);
    };
  }, []);

  return mode;
}

function useInView(active: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const node = ref.current;
    if (!active || !node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [active]);

  return { ref, inView };
}

const getHeroItem = (reduceMotion: boolean) => ({
  hidden: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: reduceMotion ? 0 : 0.75,
      ease: easeOutExpo,
      delay: reduceMotion ? 0 : 0.55,
    },
  },
});

export function getHeroVisualAnimation(reduceMotion: boolean, revealed = true) {
  const hidden = { opacity: 0, clipPath: 'inset(0 0 0 18%)' };
  const visible = { opacity: 1, clipPath: 'inset(0 0 0 0%)' };

  return {
    initial: reduceMotion ? (false as const) : hidden,
    animate: reduceMotion || revealed ? visible : hidden,
    transition: {
      duration: reduceMotion ? 0 : 1.25,
      ease: easeOutExpo,
      delay: reduceMotion ? 0 : 0.08,
    },
  };
}

export function Hero({
  content,
  contained = false,
  onVisualReady,
  splitProgress,
}: HeroProps) {
  const sceneMode = useHeroSceneMode();
  const showWebGL = sceneMode === 'webgl';
  const { ref: visualRef, inView } = useInView(showWebGL);
  const reduceMotion = useReducedMotionPreference();
  const introReady = useIntroReady();
  const heroItemVariants = useMemo(
    () => getHeroItem(reduceMotion),
    [reduceMotion],
  );
  const words = content.role.trim().split(/\s+/);
  const editorialWord = words.pop() ?? content.role;
  const primaryWords = words.join(' ');
  const revealed = reduceMotion || introReady;
  const heroVisualAnimation = useMemo(
    () => getHeroVisualAnimation(reduceMotion, revealed),
    [reduceMotion, revealed],
  );
  const restingProgress = useMotionValue(0);
  const transitionProgress = splitProgress ?? restingProgress;
  const eyebrowX = useTransform(transitionProgress, [0, 1], ['0vw', '-7.2vw']);
  const eyebrowY = useTransform(transitionProgress, [0, 1], ['0svh', '-18svh']);
  const primaryX = useTransform(transitionProgress, [0, 1], ['0vw', '-3.6vw']);
  const primaryY = useTransform(transitionProgress, [0, 1], ['0svh', '-13svh']);
  const editorialX = useTransform(transitionProgress, [0, 1], ['0vw', '13vw']);
  const descriptionX = useTransform(
    transitionProgress,
    [0, 1],
    ['0vw', '10.8vw'],
  );
  const descriptionY = useTransform(
    transitionProgress,
    [0, 1],
    ['0svh', '10.8svh'],
  );
  const actionX = useTransform(transitionProgress, [0, 1], ['0vw', '7.2vw']);
  const actionY = useTransform(transitionProgress, [0, 1], ['0svh', '14.4svh']);
  const visualX = useTransform(transitionProgress, [0, 1], ['0vw', '6vw']);
  const visualY = useTransform(transitionProgress, [0, 1], ['0svh', '-4svh']);

  useEffect(() => {
    if (sceneMode === 'fallback') onVisualReady?.();
  }, [onVisualReady, sceneMode]);

  return (
    <section
      className={cn(
        'relative isolate grid overflow-hidden px-page',
        contained
          ? 'h-full min-h-0 pb-8 pt-28 lg:grid-cols-12 lg:grid-rows-[auto_1fr_auto] lg:pb-10 lg:pt-28'
          : 'min-h-svh pb-10 pt-28 lg:min-h-[100svh] lg:grid-cols-12 lg:grid-rows-[auto_1fr_auto] lg:pb-14 lg:pt-36',
      )}
      aria-labelledby="hero-title"
    >
      <div className="hairline absolute inset-x-page top-24 lg:top-28" />

      <div
        className={cn(
          'relative z-20 my-auto lg:col-span-10',
          contained ? 'py-10 sm:py-12 lg:py-14' : 'py-16 sm:py-20 lg:py-24',
        )}
      >
        <motion.div
          data-testid="hero-split-eyebrow"
          style={{ x: eyebrowX, y: eyebrowY, willChange: 'transform' }}
        >
          <RevealText
            as="p"
            trigger="intro"
            className="mb-5 text-label uppercase text-muted-foreground"
          >
            {content.name}
          </RevealText>
        </motion.div>
        <h1
          id="hero-title"
          className="max-w-[11ch] text-display font-medium leading-[0.82] tracking-[-0.07em]"
        >
          <motion.span
            data-testid="hero-split-primary"
            className="block"
            style={{ x: primaryX, y: primaryY, willChange: 'transform' }}
          >
            <RevealText delay={0.12} trigger="intro">
              {primaryWords}&nbsp;
            </RevealText>
          </motion.span>
          <motion.span
            data-testid="hero-split-editorial"
            className="block"
            style={{ x: editorialX, willChange: 'transform' }}
          >
            <RevealText delay={0.24} trigger="intro">
              <span className="font-serif font-normal italic tracking-[-0.045em]">
                {editorialWord}
              </span>
            </RevealText>
          </motion.span>
        </h1>
        <motion.div
          data-testid="hero-split-description"
          style={{ x: descriptionX, y: descriptionY, willChange: 'transform' }}
        >
          <RevealText
            as="p"
            delay={0.42}
            trigger="intro"
            className="mt-8 max-w-sm text-balance text-base leading-relaxed text-muted-foreground sm:max-w-md lg:ml-[50%] lg:text-lg"
          >
            I shape precise digital experiences where technology, typography,
            and motion move as one.
          </RevealText>
        </motion.div>
      </div>

      <motion.div
        ref={visualRef}
        data-testid="hero-visual"
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[-18vw] bottom-[8%] top-[18%] z-0 opacity-70 sm:inset-x-[18%] sm:bottom-[2%] sm:top-[15%] lg:inset-y-[9%] lg:left-[43%] lg:right-[-3%] lg:opacity-90"
        style={{ x: visualX, y: visualY, willChange: 'transform' }}
      >
        <motion.div
          data-testid="hero-visual-reveal"
          className="relative size-full [&_canvas]:!h-full [&_canvas]:!w-full"
          style={{ willChange: 'clip-path, opacity' }}
          {...heroVisualAnimation}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgb(243_241_234/9%),transparent_58%)]" />
          {showWebGL ? (
            <HeroSceneBoundary onFallback={onVisualReady}>
              <Suspense fallback={null}>
                <LazyHeroScene
                  active={revealed}
                  inView={inView}
                  onReady={onVisualReady}
                />
              </Suspense>
            </HeroSceneBoundary>
          ) : sceneMode === 'fallback' ? (
            <HeroFallback />
          ) : null}
        </motion.div>
      </motion.div>

      <motion.div
        data-testid="hero-split-action"
        className="relative z-20 lg:col-span-12"
        style={{ x: actionX, y: actionY, willChange: 'transform' }}
      >
        <motion.div
          className="grid items-end gap-6 text-label uppercase lg:grid-cols-12"
          initial="hidden"
          animate={revealed ? 'visible' : 'hidden'}
          variants={heroItemVariants}
        >
          <MagneticLink
            className="group inline-flex w-fit items-center gap-3 lg:col-span-4"
            href="#projects"
          >
            <span className="grid size-9 place-items-center rounded-full border border-white/25 transition-colors group-hover:bg-paper group-hover:text-ink">
              ↓
            </span>
            Explore projects
          </MagneticLink>
        </motion.div>
      </motion.div>
    </section>
  );
}
