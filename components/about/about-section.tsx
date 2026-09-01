import { RevealText } from "@/components/ui/reveal-text";
import { SectionHeading } from "@/components/ui/section-heading";
import type { PortfolioContent } from "@/content/portfolio";

type AboutSectionProps = {
  content: PortfolioContent["about"] & Pick<PortfolioContent["person"], "availability">;
};

export function AboutSection({ content }: AboutSectionProps) {
  return (
    <section id="about" className="border-t border-white/15 px-page py-24 sm:py-28 lg:py-40">
      <SectionHeading index="001" eyebrow="Profile" title="About me" />

      <div className="mt-16 grid gap-14 lg:mt-24 lg:grid-cols-12 lg:gap-y-24">
        <div className="lg:col-span-7 lg:col-start-4">
          <RevealText as="p" className="max-w-[15ch] font-serif text-[clamp(2.8rem,6vw,6.75rem)] leading-[0.94] tracking-[-0.05em]">
            {content.statement}
          </RevealText>
        </div>

        <div className="lg:col-span-4 lg:row-start-2">
          <figure
            aria-label="Portrait placeholder"
            className="relative aspect-[4/5] overflow-hidden border border-white/15 bg-[radial-gradient(circle_at_62%_28%,rgb(243_241_234/16%),transparent_25%),linear-gradient(145deg,rgb(29_29_29),rgb(9_9_9))]"
          >
            <div aria-hidden="true" className="absolute inset-x-[12%] top-1/2 h-px bg-white/20" />
            <div aria-hidden="true" className="absolute inset-y-[10%] left-1/2 w-px bg-white/20" />
            <div aria-hidden="true" className="absolute inset-[22%] border border-white/10" />
            <figcaption className="absolute inset-x-4 bottom-4 flex justify-between text-label uppercase text-muted-foreground">
              <span>Portrait placeholder</span><span>4:5</span>
            </figcaption>
          </figure>
        </div>

        <div className="grid content-start gap-10 lg:col-span-5 lg:col-start-7 lg:row-start-2">
          <div className="flex items-center gap-3 text-label uppercase text-muted-foreground">
            <span className="size-2 rounded-full bg-paper" aria-hidden="true" />
            <span>{content.availability}</span>
          </div>
          <div className="grid gap-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
            {content.paragraphs.map((paragraph) => (
              <RevealText as="p" key={paragraph}>{paragraph}</RevealText>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
