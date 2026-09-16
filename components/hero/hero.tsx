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
  type RefObject,
} from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  type MotionValue,
} from 'motion/react';

import { BlurInText } from '@/components/ui/blur-in-text';
import {
  CharRevealText,
  getCharRevealSequenceDelay,
} from '@/components/ui/char-reveal-text';
import { useIntroReady } from '@/hooks/use-intro-ready';
import { useIsHandheld } from '@/hooks/use-is-handheld';
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
    'name' | 'role' | 'intro' | 'location' | 'availability'
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
    /*
      The same question the rest of the page asks, and for the same reason: a
      phone turned sideways clears `min-width: 768px` and was lighting up a
      WebGL canvas on the device least able to carry one.
    */
    /*
      No WebGL on anything held in the hand. An iPad clears any width test worth
      writing, and on one the canvas was laid over the title rather than behind
      it; on a phone it is simply the most expensive thing on the page.
    */
    const desktop = window.matchMedia('(min-width: 768px) and (pointer: fine)');
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

function useInView(active: boolean, ref: RefObject<HTMLElement | null>) {
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
  }, [active, ref]);

  return inView;
}

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
  const heroRef = useRef<HTMLElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const inView = useInView(showWebGL, heroRef);
  const reduceMotion = useReducedMotionPreference();
  const handheld = useIsHandheld();
  const introReady = useIntroReady();
  const words = content.role.trim().split(/\s+/);
  const editorialWord = words.pop() ?? content.role;
  const primaryWords = words.join(' ');
  const primaryDelay = 0.12;
  const editorialDelay = getCharRevealSequenceDelay(primaryWords, primaryDelay);
  const revealed = reduceMotion || introReady;
  const heroVisualAnimation = useMemo(
    () => getHeroVisualAnimation(reduceMotion, revealed),
    [reduceMotion, revealed],
  );
  const restingProgress = useMotionValue(0);
  const transitionProgress = splitProgress ?? restingProgress;
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
  const visualX = useTransform(transitionProgress, [0, 1], ['0vw', '6vw']);
  const visualY = useTransform(transitionProgress, [0, 1], ['0svh', '-4svh']);

  useEffect(() => {
    if (sceneMode === 'fallback') onVisualReady?.();
  }, [onVisualReady, sceneMode]);

  return (
    <section
      ref={heroRef}
      className={cn(
        'relative isolate grid overflow-hidden px-page',
        contained
          ? 'h-full min-h-0 pb-8 pt-28 lg:grid-cols-12 lg:grid-rows-[auto_1fr_auto] lg:pb-10 lg:pt-28'
          : 'min-h-svh pb-10 pt-28 lg:min-h-[100svh] lg:grid-cols-12 lg:grid-rows-[auto_1fr_auto] lg:pb-14 lg:pt-36',
      )}
      aria-labelledby="hero-title"
    >
      <div className="hairline absolute inset-x-page top-24 lg:top-28" />

      {/*
        Nudged toward the middle, and only on a wide screen.

        The sculpture sits on the right and the type on the left, and how much
        air is between them depends entirely on the width: measured, a 1920
        screen leaves 113px of gap while a 1440 one has the title already
        touching the canvas at 619px. A shift written without a breakpoint
        would buy space on the wide screen by causing a collision on the
        narrow one, so it starts at 2xl, where the gap exists to spend.
      */}
      <div
        className={cn(
          'relative z-20 my-auto lg:col-span-10 2xl:pl-[3vw]',
          contained
            ? 'translate-y-6 py-10 sm:translate-y-8 sm:py-12 lg:translate-y-10 lg:py-14'
            : 'translate-y-12 py-16 sm:translate-y-16 sm:py-20 lg:translate-y-24 lg:py-24',
        )}
      >
        <h1
          id="hero-title"
          aria-label={content.role}
          /*
            Centred on a phone whichever way it is held.

            `sm:text-left` is a width test, and a handset turned sideways is
            844px across, so the title swung back to the left margin the moment
            anyone rotated. The alignment follows the same question the rest of
            the page asks about phones instead. The size stays a width test:
            that is what it is.

            The size reaches for the variable rather than for a class named
            after it. It used to say `sm:text-display`, which looked right and
            did nothing: `.text-display` was hand-written CSS in `globals.css`
            and not a utility Tailwind owns, so no `sm:` variant of it was ever
            emitted. The phone clamp below governed every width instead, which
            at 1440 made the title 192px where this asks for 170, and ran
            `Developer` into the sculpture.
          */
          className={cn(
            "mx-auto max-w-[12ch] text-center font-display text-[clamp(3.2rem,14vw,12rem)] font-medium leading-[0.66] tracking-[-0.075em] sm:text-[length:var(--display-size)]",
            !handheld && "sm:mx-0 sm:text-left",
          )}
        >
          <motion.span
            data-testid="hero-split-primary"
            className="block"
            style={{ x: primaryX, y: primaryY, willChange: 'transform' }}
          >
            <CharRevealText delay={primaryDelay} trigger="intro">
              {`${primaryWords} `}
            </CharRevealText>
          </motion.span>
          <motion.span
            data-testid="hero-split-editorial"
            className="-mt-[0.26em] block pl-[0.02em]"
            style={{ x: editorialX, willChange: 'transform' }}
          >
            <CharRevealText
              delay={editorialDelay}
              trigger="intro"
              className="font-editorial font-normal italic tracking-[-0.055em] text-paper/80"
            >
              {editorialWord}
            </CharRevealText>
          </motion.span>
        </h1>
        <motion.div
          data-testid="hero-split-intro"
          style={{ x: descriptionX, y: descriptionY, willChange: 'transform' }}
          className="mt-16 lg:mt-24"
        >
          <BlurInText
            as="p"
            delay={0.36}
            trigger="intro"
            className={cn(
              "mx-auto max-w-xl text-pretty text-center text-[1.75rem] font-medium leading-tight tracking-[-0.01em] text-paper/65",
              !handheld && "sm:mx-0",
            )}
          >
            {content.intro}
          </BlurInText>
        </motion.div>
      </div>

      <motion.div
        ref={visualRef}
        data-testid="hero-visual"
        aria-hidden="true"
        /*
          Full bleed on anything held in the hand.

          From `sm` up this becomes the right-hand column of the desktop's
          side-by-side composition, and that is a width test: on a tablet in
          portrait it came out as a 619px band starting 444px in, with a hard
          left edge across an otherwise flat black, and the centred title
          sitting over it. Below `sm` it is inset by -18vw instead, spilling
          past both edges so there is no edge to see — which is the right
          behaviour for every handheld, not only for a narrow one.
        */
        className={cn(
          "pointer-events-none absolute inset-x-[-18vw] bottom-[8%] top-[18%] z-0 opacity-70",
          !handheld &&
            "sm:inset-x-[18%] sm:bottom-[2%] sm:top-[15%] lg:inset-y-[9%] lg:left-[43%] lg:right-[-3%] lg:opacity-90",
        )}
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
                  pointerTarget={visualRef}
                />
              </Suspense>
            </HeroSceneBoundary>
          ) : sceneMode === 'fallback' ? (
            <HeroFallback />
          ) : null}
        </motion.div>
      </motion.div>
    </section>
  );
}
