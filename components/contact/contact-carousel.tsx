"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useAnimationFrame, useInView, useMotionValue, useTransform } from "motion/react";

import { StackIcon } from "@/components/stack/stack-icon";
import { stackIcons } from "@/lib/stack-icons";
import { useIsHandheld } from "@/hooks/use-is-handheld";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";
import { socialNetworks, type SocialNetwork } from "@/lib/social-catalog";
import { cn } from "@/lib/utils";
import { useCopy } from "@/components/providers/language-provider";

/** `--paper`: the ground these cards are drawn on, so the marks are judged against it. */
const PAPER = "#f3f1ea";
/** `--ink`: what the tile fills with under the pointer, so the mark is judged against that instead. */
const INK = "#090909";

/**
 * Percent of the rail per second.
 *
 * Measured off the reference at 17.6px/s — slow enough to read a card without
 * chasing it, which is the whole point of showing them this way rather than as
 * a list. Expressed against the rail's own width so it holds that pace at any
 * viewport instead of racing on a phone.
 *
 * 1.15 was the first guess and measured 37px/s here, twice the reference: a
 * percentage of the rail is not a speed until you know how wide the rail is.
 */
export const CAROUSEL_SPEED = 0.55;

/**
 * Where the rail sits after `deltaMs`, given where it was.
 *
 * Two identical copies are laid side by side and the rail travels the width of
 * one, so the moment it has moved a full copy the position resets to zero and
 * the next copy is already exactly where the first was. Kept pure and exported
 * because the wrap is the part that breaks silently: a reset that overshoots
 * shows a seam for one frame, and a frame is all it takes to be seen.
 */
export function getCarouselPosition(position: number, deltaMs: number) {
  const next = position - (deltaMs / 1000) * CAROUSEL_SPEED;
  return next <= -50 ? next + 50 : next;
}

/**
 * The tile fills on hover and the glyph turns to read against it.
 *
 * The reference does this the other way up — a white tile on a dark card — and
 * the point survives the inversion: the mark stops being an outline on the
 * surface and becomes a solid object sitting on it.
 */
function NetworkMark({ network, compact = false }: { network: SocialNetwork; compact?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-xl bg-black/[0.06] transition-colors duration-300 ease-expo-out group-hover/card:bg-ink group-focus-visible/card:bg-ink",
        compact ? "size-9" : "size-11",
      )}
    >
      {network.icon === null ? (
        <span className="font-serif text-lg lowercase leading-none tracking-[-0.04em] text-ink transition-colors duration-300 ease-expo-out group-hover/card:text-paper group-focus-visible/card:text-paper">
          {network.lettermark}
        </span>
      ) : (
        <>
          {/*
            Two copies of the same mark, one judged against each ground, and the
            tile cross-fades between them. A single `fill` cannot animate here:
            it is chosen per brand by contrast, so the colour that is right on
            paper is frequently the one that disappears on ink.
          */}
          <StackIcon
            background={PAPER}
            className="col-start-1 row-start-1 size-5 transition-opacity duration-300 ease-expo-out group-hover/card:opacity-0 group-focus-visible/card:opacity-0"
            slug={network.icon}
          />
          <StackIcon
            background={INK}
            className="col-start-1 row-start-1 size-5 opacity-0 transition-opacity duration-300 ease-expo-out group-hover/card:opacity-100 group-focus-visible/card:opacity-100"
            slug={network.icon}
          />
        </>
      )}
    </span>
  );
}

/**
 * The brand mark again, far bigger and almost invisible, bleeding out of the
 * top-right corner — then brought up and enlarged under the pointer.
 *
 * Measured off the reference: opacity 0.03 to 0.1, scale 1 to 1.25. It is what
 * gives the card something to do on hover beyond changing colour, and because
 * it is clipped by the card it reads as depth rather than as decoration.
 */
function NetworkWatermark({ network }: { network: SocialNetwork }) {
  /*
    `scale` and `translate`, not `transform`.

    Listed as `transform` — the shorthand these used to be — the browser had
    nothing to interpolate: Tailwind v4 writes `scale-125` to the `scale`
    property, so the mark jumped to full size on the first frame and only the
    fade was ever animated. Measured, it read 1.25 at 0ms and stayed there,
    which is exactly the "it just appears" this is fixing.
  */
  const shared =
    "pointer-events-none absolute -right-6 -top-6 origin-top-right opacity-[0.03] transition-[opacity,scale,translate] duration-700 ease-expo-out group-hover/card:-translate-x-1 group-hover/card:translate-y-1 group-hover/card:scale-125 group-hover/card:opacity-[0.10] group-focus-visible/card:-translate-x-1 group-focus-visible/card:translate-y-1 group-focus-visible/card:scale-125 group-focus-visible/card:opacity-[0.10] motion-reduce:transition-none";

  if (network.icon === null) {
    return (
      <span
        aria-hidden="true"
        className={cn(shared, "font-serif text-[7rem] lowercase leading-none text-ink")}
      >
        {network.lettermark}
      </span>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className={cn(shared, "size-36 fill-ink")}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={stackIcons[network.icon].path} />
    </svg>
  );
}

/*
  `overflow-hidden` so the watermark is cropped by the card rather than
  spilling onto its neighbour, and `motion-reduce` drops the lift and the scale
  while leaving every colour change intact — the card still answers the pointer
  for a reader who asked for stillness, just without moving.
*/
const CARD_CLASS =
  "focus-ring group/card relative flex shrink-0 flex-col justify-between overflow-hidden rounded-2xl border bg-black/[0.02] text-left transition-[background-color,translate,scale] duration-300 ease-expo-out hover:-translate-y-1 hover:scale-[1.02] hover:bg-black/[0.05] focus-visible:-translate-y-1 focus-visible:scale-[1.02] focus-visible:bg-black/[0.05] motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100 motion-reduce:focus-visible:translate-y-0 motion-reduce:focus-visible:scale-100";

/*
  Written as a style rather than as `border-black/12`.

  `app/globals.css` sets `border-color` on a bare `*` outside any layer, and an
  unlayered rule beats every layered utility — so every `border-<colour>` class
  in this project is inert, and this card's edge came out as the site's
  dark-mode white on cream. An inline style is the one thing that wins without
  changing that rule for the whole site. The reference does not animate its
  border either, so nothing is lost.
*/
const CARD_BORDER = { borderColor: "rgb(9 9 9 / 0.14)" };

const CARD_WIDTH = "w-[17.5rem] sm:w-[19rem]";
/** Tighter padding for the pyramid, where a card is about 106px across. */
const CARD_COMPACT = "p-2.5";

function CardFace({
  network,
  action,
  compact = false,
}: {
  network: SocialNetwork;
  action: ReactNode;
  compact?: boolean;
}) {
  /*
    Stacked and centred when the card is only a third of a phone wide. The
    divider and the action row go with it: the whole card is the link, so at
    this size the label was repeating what the card already is, and it was the
    line that pushed the handle into an ellipsis.
  */
  if (compact) {
    return (
      <>
        <NetworkWatermark network={network} />
        <span className="relative flex flex-col items-center gap-1.5 text-center">
          <NetworkMark compact network={network} />
          <span className="block w-full">
            <span className="block truncate text-xs font-medium tracking-[-0.02em]">
              {network.name}
            </span>
            <span className="mt-0.5 block truncate text-[0.68rem] text-black/60 transition-colors duration-300 ease-expo-out group-hover/card:text-black/85 group-focus-visible/card:text-black/85">
              {network.handle}
            </span>
          </span>
        </span>
      </>
    );
  }

  return (
    <>
      <NetworkWatermark network={network} />

      <span className="relative flex items-center gap-3.5">
        <NetworkMark network={network} />
        <span className="min-w-0">
          <span className="block truncate font-medium tracking-[-0.02em]">{network.name}</span>
          <span className="block truncate text-sm text-black/60 transition-colors duration-300 ease-expo-out group-hover/card:text-black/85 group-focus-visible/card:text-black/85">
            {network.handle}
          </span>
        </span>
      </span>

      <span aria-hidden="true" className="relative mt-6 block h-px w-full bg-black/12 transition-colors duration-300 ease-expo-out group-hover/card:bg-black/25 group-focus-visible/card:bg-black/25" />

      <span className="relative mt-3 flex items-center justify-between text-label uppercase tracking-[0.16em] text-black/60 transition-colors duration-300 ease-expo-out group-hover/card:text-black/85 group-focus-visible/card:text-black/85">
        {action}
        {/*
          Slides in from the left as it fades up, which is the reference's own
          8px. It is the one part of the card that arrives rather than simply
          changing, and that is what makes the whole thing read as a response.
        */}
        <span aria-hidden="true" className="-translate-x-2 opacity-50 transition-[opacity,translate] duration-300 ease-expo-out group-hover/card:translate-x-0 group-hover/card:opacity-100 group-focus-visible/card:translate-x-0 group-focus-visible/card:opacity-100">
          ↗
        </span>
      </span>
    </>
  );
}

/**
 * The card for an account that has nowhere to send you.
 *
 * Discord names a person, not a page, so this hands over the username instead
 * of pretending to be a link. `aria-live` on the label rather than a toast:
 * the confirmation belongs where the reader is already looking, and a reader
 * who cannot see the change is told about it in the same breath.
 */
function CopyCard({ network, focusable, full, compact }: { network: SocialNetwork; focusable: boolean; full?: boolean; compact?: boolean }) {
  const copy = useCopy();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <button
      className={cn(CARD_CLASS, full ? "w-full" : CARD_WIDTH, compact ? CARD_COMPACT : "p-5")}
      data-testid="contact-card"
      onClick={() => {
        navigator.clipboard?.writeText(network.handle).then(
          () => setCopied(true),
          // A refused clipboard is not worth an error state; the username is
          // on the card either way, to be read and typed.
          () => undefined,
        );
      }}
      style={CARD_BORDER}
      tabIndex={focusable ? undefined : -1}
      type="button"
    >
      <CardFace
        compact={compact}
        action={
          <span aria-live="polite">{copied ? copy.copied : copy.copyUsername}</span>
        }
        network={network}
      />
    </button>
  );
}

function NetworkCard({ network, focusable = true, full = false, compact = false }: { network: SocialNetwork; focusable?: boolean; full?: boolean; compact?: boolean }) {
  const copy = useCopy();

  if (network.href === null)
    return <CopyCard compact={compact} focusable={focusable} full={full} network={network} />;

  return (
    <a
      className={cn(CARD_CLASS, full ? "w-full" : CARD_WIDTH, compact ? CARD_COMPACT : "p-5")}
      data-testid="contact-card"
      href={network.href}
      rel="noreferrer"
      style={CARD_BORDER}
      tabIndex={focusable ? undefined : -1}
      target="_blank"
    >
      <CardFace action={copy.connect} compact={compact} network={network} />
      <span className="sr-only">{copy.opensInNewTab}</span>
    </a>
  );
}

/**
 * The five accounts, tapering when there is no room to do otherwise.
 *
 * A wrapping row rather than a grid, and the taper falls out of it: at 375px
 * three cards fit across and the remaining two wrap and centre themselves,
 * which is the inverted pyramid. Turn the phone and 844px of width takes all
 * five in one line, which is the right shape there — the pyramid exists
 * because a portrait phone is narrow, not for its own sake, and two stacked
 * rows put this section 108px past a landscape screen it has to end on.
 *
 * `justify-center` is doing the centring on every row, so no row needs to know
 * how many are above it. The cards go compact because three across a phone is
 * about 100px each, which is not a width that holds a mark, a name and a
 * handle side by side.
 */
function ContactPyramid({ className }: { className?: string }) {
  return (
    <ul
      /*
        Two gutters, not one. The row this replaces is deliberately pulled a
        gutter past the section's edge so it can bleed off screen, and a single
        `px-page` inside that only cancels the pull: the cards came out flush
        against both edges of the phone.
      */
      className={cn(
        "flex flex-wrap justify-center gap-2 px-[calc(var(--page-gutter)*2)]",
        className,
      )}
      data-testid="contact-carousel"
    >
      {/*
        5.5rem is the width at which three still fit across a 320px phone, which
        is the narrowest screen worth holding to. A tablet has no such problem,
        and a card sized for a phone reads as undersized on one, so it grows
        where there is room for it to.
      */}
      {socialNetworks.map((network) => (
        <li className="flex w-[5.5rem] sm:w-[7.5rem] lg:w-[9.5rem]" key={network.name}>
          <NetworkCard compact full network={network} />
        </li>
      ))}
    </ul>
  );
}

export function ContactCarousel({ className }: { className?: string }) {
  const handheld = useIsHandheld();
  const reduceMotion = useReducedMotionPreference();
  const position = useMotionValue(0);
  const x = useTransform(position, (value) => `${value}%`);
  /**
   * Held still while it is being used.
   *
   * Focus only. Hovering used to hold it too, and that came out on request —
   * the row stopping dead under the cursor read as the animation breaking
   * rather than as it yielding.
   *
   * Focus is a different case and stays: a keyboard reader who tabs onto a card
   * cannot nudge it back, so without this they would watch the thing they just
   * selected leave the screen.
   *
   * A ref rather than state: this is read inside the frame loop, and a
   * re-render per hover would be a lot of work to change one boolean.
   */
  const held = useRef(false);

  /**
   * Nothing moves while nobody can see it.
   *
   * This sits on the last screen of a very long page, and the frame loop does
   * not care where the reader is — left ungated it was doing work on every
   * frame of the hero, the about handover and both pinned rails, which are the
   * parts of this site with the least frame budget to spare.
   */
  const frame = useRef<HTMLDivElement>(null);
  const onScreen = useInView(frame, { margin: "200px" });

  useAnimationFrame((_time, delta) => {
    if (reduceMotion || held.current || !onScreen) return;
    position.set(getCarouselPosition(position.get(), delta));
  });

  /**
   * Still a list when the motion is off, never nothing.
   *
   * The decorative rails in the stack section simply do not render for a reader
   * who asked for stillness — they carry no information, so removing them costs
   * that reader nothing. These cards are the only way to reach the accounts, so
   * the same treatment would take the links away from exactly the people least
   * able to chase a moving target. They wrap and sit still instead.
   */
  /*
    A phone gets the pyramid instead of the rail. Sliding five cards past a
    300px window means most of them are off screen most of the time, and it
    costs a frame loop on the device least able to spare one.
  */
  if (handheld) return <ContactPyramid className={className} />;

  if (reduceMotion) {
    // `px-page` puts back the gutter the moving row deliberately runs past: a
    // static list has no reason to touch the edge of the screen.
    return (
      <ul className={cn("flex flex-wrap gap-4 px-page", className)} data-testid="contact-carousel">
        {socialNetworks.map((network) => (
          <li key={network.name}>
            <NetworkCard network={network} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    /**
     * Faded at both ends rather than cut, so the row reads as continuing past
     * the screen instead of being clipped by a box.
     */
    <div
      className={cn(
        "group/carousel overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]",
        className,
      )}
      data-testid="contact-carousel"
      ref={frame}
      onBlurCapture={() => { held.current = false; }}
      onFocusCapture={() => { held.current = true; }}
    >
      <motion.div className="flex w-max will-change-transform" style={{ x }}>
        {[0, 1].map((copy) => (
          <ul
            aria-hidden={copy === 1}
            className="flex shrink-0 gap-4 pr-4"
            key={copy}
          >
            {/*
              One copy is the real list and the other is scenery. `aria-hidden`
              keeps a screen reader from being read five accounts twice, and
              `tabIndex={-1}` keeps the same from happening to the keyboard.

              Not `inert`, which was the first way of saying this and turned out
              to say far too much: inert content never matches `:hover` either,
              so every card went dead the moment the loop carried this copy into
              view — the hover worked once and then, to the reader, stopped
              working at all.
            */}
            {socialNetworks.map((network) => (
              <li className="flex" key={`${copy}-${network.name}`}>
                <NetworkCard focusable={copy === 0} network={network} />
              </li>
            ))}
          </ul>
        ))}
      </motion.div>
    </div>
  );
}
