import { stackIcons, type StackIconSlug } from "@/lib/stack-icons";
import { cn } from "@/lib/utils";

/** This site's ground, `--ink`. Brand colours are judged against it. */
const INK = "#090909";
/** `--paper`, the substitute for a mark that cannot be seen on the ink. */
const PAPER = "#f3f1ea";

/**
 * Below this contrast ratio against the ground a mark stops being a mark. Not
 * a WCAG threshold — brand icons here are decorative and labelled in text
 * beside them — just the point where the shape dissolves into the background.
 */
const MIN_ICON_CONTRAST = 2.5;

function channelLuminance(channel: number) {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string) {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.replace(/./g, (c) => c + c) : value;
  const r = channelLuminance(Number.parseInt(full.slice(0, 2), 16));
  const g = channelLuminance(Number.parseInt(full.slice(2, 4), 16));
  const b = channelLuminance(Number.parseInt(full.slice(4, 6), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string) {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * The brand colour, unless it would vanish into the page.
 *
 * A handful of the marks here are deliberately pure black — Next.js, Vercel
 * and Three.js all ship a monochrome logo whose published dark-background
 * variant is white — and Prisma's slate is barely better. Drawing `hex`
 * unconditionally would leave four holes in the row. Swapping those to paper
 * is what their own brand guidance does, so this stays faithful rather than
 * inventing a tint.
 */
export function getStackIconColor(hex: string, background = INK) {
  if (contrastRatio(hex, background) >= MIN_ICON_CONTRAST) return hex;

  /**
   * The substitute has to answer to the ground it is drawn on, not to this
   * site's usual one. Paper was hardcoded here while everything using these
   * marks sat on the ink — then the contact carousel put them on the light
   * section, where it turned GitHub's near-black into cream on cream.
   */
  return contrastRatio(PAPER, background) >= contrastRatio(INK, background) ? PAPER : INK;
}

type StackIconProps = {
  slug: StackIconSlug | null;
  className?: string;
  /** The ground the mark is drawn on, when it is not this site's usual ink. */
  background?: string;
};

export function StackIcon({ slug, className, background = INK }: StackIconProps) {
  // Tools with no published mark in the icon set. A neutral ring keeps the
  // row's rhythm instead of leaving a ragged gap where an icon should be.
  if (slug === null) {
    return (
      <span
        aria-hidden="true"
        className={cn("size-[1.15em] shrink-0 rounded-full border border-white/35", className)}
        data-testid="stack-icon-fallback"
      />
    );
  }

  const icon = stackIcons[slug];

  return (
    <svg
      aria-hidden="true"
      className={cn("size-[1.15em] shrink-0", className)}
      data-testid="stack-icon"
      fill={getStackIconColor(icon.hex, background)}
      role="presentation"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={icon.path} />
    </svg>
  );
}
