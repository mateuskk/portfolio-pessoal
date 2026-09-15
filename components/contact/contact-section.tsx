"use client";

import { ContactCarousel } from "@/components/contact/contact-carousel";
import { MagneticLink } from "@/components/ui/magnetic-link";
import { RevealText } from "@/components/ui/reveal-text";
import type { PortfolioContent } from "@/content/portfolio";
import { useCopy } from "@/components/providers/language-provider";

type ContactSectionProps = {
  contact: PortfolioContent["contact"];
};

/**
 * The last screen, and sized to be exactly that.
 *
 * `--footer-h` is the footer's own height. The copyright has to sit inside this view
 * rather than on a strip below it, but it cannot simply move in here: a
 * `<footer>` is only the document's `contentinfo` landmark while it is outside
 * `<main>`, and this section is not. So the footer stays where it is and this
 * section gives up precisely its height, which puts the two together at one
 * screen with the copyright in the bottom corner of it.
 */
export function ContactSection({ contact }: ContactSectionProps) {
  const copy = useCopy();

  return (
    <section
      id="contact"
      /*
        The rhythm is measured in screen height, not in a fixed step.
        Fixed padding sized for a 900px screen came to 320px of air, which on a
        720px laptop left the composition 128px taller than the screen it is
        supposed to end on — the one thing this section must not do.
      */
      className="relative flex min-h-[calc(100svh-var(--footer-h))] flex-col justify-center overflow-hidden bg-paper py-[2svh] text-ink lg:py-[4svh]"
    >
      <div aria-hidden="true" className="absolute inset-x-page top-0 h-px bg-black/20" />

      {/*
        One group, centred as a whole.

        The text block used to take `flex-1`, which made it swallow every spare
        pixel and press the cards against the bottom edge: on a 1376px iPad they
        sat at 1158 with the email stranded far above, and a window even
        slightly shorter than the viewport cut them off entirely. Reads, quite
        reasonably, as the cards not being there at all.

        Centred, so the address sits under the middle of the heading rather
        than under its first letter. Left where it was, a centred heading with
        the email still tucked into the corner reads as two compositions that
        happen to share a screen.
      */}
      <div className="flex flex-col items-center gap-[3svh] px-page text-center lg:gap-[6svh]">
        {/*
          The floor is for a small phone, not for the look: on a 320px screen
          the old 4rem minimum was the thing that pushed this section past the
          screen, because below about 360px the clamp stops reading the
          viewport and simply holds the floor. Desktop never sees it, where the
          width and height terms are both far above.

          Capped by height as well as width. Sized from the viewport width
          alone, the heading kept its full size on a short wide screen — a
          1366x668 laptop is exactly that — and pushed the composition past the
          screen it has to end on. The height cap is loose enough that it does
          not bite at 900px tall, where the width still decides.

          The measure is wider than it was: centred and given room, each line
          holds on one row instead of wrapping to two, and the height that
          saves is what pays for the larger type.
        */}
        <h2>
          <RevealText className="mx-auto max-w-[22ch] font-serif text-[clamp(2.6rem,min(11.6vw,17svh),14rem)] leading-[0.88] tracking-[-0.05em]">
            {copy.contactLineOne}
          </RevealText>
          <RevealText className="mx-auto mt-3 max-w-[22ch] text-[clamp(2rem,min(10vw,14.8svh),12.5rem)] font-medium leading-[0.88] tracking-[-0.065em]">
            {copy.contactLineTwo}
          </RevealText>
        </h2>

        <MagneticLink
          href={`mailto:${contact.email}`}
          className="group max-w-full text-[clamp(1.45rem,3.2vw,3.75rem)] leading-tight tracking-[-0.045em]"
        >
          <span className="break-all">{contact.email}</span>
          <span aria-hidden="true" className="mt-2 block h-[2px] origin-center bg-ink transition-transform duration-500 ease-expo-out group-hover:scale-x-50 group-focus-visible:scale-x-50" />
        </MagneticLink>
      </div>

      {/*
        Run to both edges, past the gutter the rest of the section keeps. A row
        that stops short of the margin reads as a component sitting on the page;
        one that leaves the screen reads as continuing beyond it, which is what
        makes the loop believable.
      */}
      <nav
        aria-label={copy.socialLinks}
        className="mt-[2svh] mx-[calc(var(--page-gutter)*-1)] lg:mt-[6svh]"
      >
        <ContactCarousel />
      </nav>
    </section>
  );
}
