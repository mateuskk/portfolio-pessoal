import type { ReactNode } from 'react';

export type RichTextEmphasis = 'none' | 'strong' | 'em';

export type RichTextToken = {
  text: string;
  emphasis: RichTextEmphasis;
};

/**
 * Emphasis pulls in two directions: `**bold**` advances (heavier, and brighter
 * wherever a tone sets the custom properties below), `_italic_` recedes into a
 * softer serif. Colour comes from variables rather than a literal so one pair
 * of classes serves both the paper and the dark tone; `currentColor` is the
 * fallback for callers that set neither.
 *
 * No `font-light` on the serif — Instrument Serif loads weight 400 only, so it
 * was a no-op.
 */
export const RICH_TEXT_EMPHASIS_CLASS = {
  strong: 'font-semibold text-[color:var(--rt-strong,currentColor)]',
  em: 'font-serif italic text-[color:var(--rt-em,currentColor)]',
} as const;

/**
 * The same emphasis at body size, where the display pair does not work.
 *
 * Both sets run at the very same `font-size` — the serif only *reads* smaller,
 * because Instrument Serif carries a far shorter x-height than Inter, and at a
 * headline that difference is a deliberate change of voice. Dropped into a
 * paragraph it stops reading as voice and starts reading as shrunken text, so
 * here italic keeps the body face and leans on weight instead.
 */
export const RICH_TEXT_BODY_EMPHASIS_CLASS = {
  strong: 'font-semibold text-[color:var(--rt-strong,currentColor)]',
  em: 'font-semibold italic text-[color:var(--rt-em,currentColor)]',
} as const;

/**
 * Structural on purpose. `typeof RICH_TEXT_EMPHASIS_CLASS` would inherit the
 * literal strings that `as const` pins down, and then the only set assignable
 * to it would be that one set.
 */
export type RichTextEmphasisClass = {
  strong: string;
  em: string;
};

/**
 * Splits `**bold**` and `_italic_` markdown-lite emphasis out of a plain-text
 * content string, without pulling in a full markdown parser. Kept separate
 * from rendering so animated variants can walk the same tokens.
 */
export function tokenizeRichText(text: string): RichTextToken[] {
  return text
    .split(/(\*\*[^*]+\*\*|_[^_]+_)/g)
    .filter((token) => token.length > 0)
    .map((token) => {
      if (token.startsWith('**') && token.endsWith('**')) {
        return { text: token.slice(2, -2), emphasis: 'strong' as const };
      }

      if (token.startsWith('_') && token.endsWith('_')) {
        return { text: token.slice(1, -1), emphasis: 'em' as const };
      }

      return { text: token, emphasis: 'none' as const };
    });
}

/**
 * Renders the tokens as static markup — the reduced-motion and pre-mount path.
 *
 * Takes the class set so this path cannot drift from the animated one beside
 * it: the two render the same string, and a reader switching reduced motion on
 * should not see the emphasis change with it.
 */
export function renderRichText(
  text: string,
  emphasisClass: RichTextEmphasisClass = RICH_TEXT_EMPHASIS_CLASS,
): ReactNode[] {
  return tokenizeRichText(text).map((token, index) => {
    if (token.emphasis === 'strong') {
      return (
        <strong key={index} className={emphasisClass.strong}>
          {token.text}
        </strong>
      );
    }

    if (token.emphasis === 'em') {
      return (
        <em key={index} className={emphasisClass.em}>
          {token.text}
        </em>
      );
    }

    return token.text;
  });
}
