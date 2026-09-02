import { RevealText } from '@/components/ui/reveal-text';
import { SectionHeading } from '@/components/ui/section-heading';
import type { PortfolioContent } from '@/content/portfolio';
import { cn } from '@/lib/utils';

type AboutSectionProps = {
  content: PortfolioContent['about'] &
    Pick<PortfolioContent['person'], 'availability'>;
  tone?: 'dark' | 'paper';
};

export function AboutSection({ content, tone = 'dark' }: AboutSectionProps) {
  const paper = tone === 'paper';

  return (
    <section
      id="about"
      data-tone={tone}
      className={cn(
        'border-t px-page py-24 sm:py-28 lg:py-40',
        paper ? 'border-black/15 text-ink' : 'border-white/15',
      )}
    >
      <SectionHeading
        eyebrow="Profile"
        title="About me"
        className={paper ? '[&_div]:text-black/55' : undefined}
      />

      <div className="mt-16 grid gap-14 lg:mt-24 lg:grid-cols-12 lg:gap-y-24">
        <div className="lg:col-span-7 lg:col-start-4">
          <RevealText
            as="p"
            className="max-w-[15ch] font-serif text-[clamp(2.8rem,6vw,6.75rem)] leading-[0.94] tracking-[-0.05em]"
          >
            {content.statement}
          </RevealText>
        </div>

        <div className="lg:col-span-4 lg:row-start-2">
          <figure
            aria-label="Portrait placeholder"
            className={cn(
              'relative aspect-[4/5] overflow-hidden bg-[radial-gradient(circle_at_62%_28%,rgb(243_241_234/16%),transparent_25%),linear-gradient(145deg,rgb(29_29_29),rgb(9_9_9))]',
              paper ? 'border border-black/20' : 'border border-white/15',
            )}
          >
            <figcaption className="absolute inset-x-4 bottom-4 flex justify-between text-label uppercase text-white/60">
              <span>Portrait placeholder</span>
              <span>4:5</span>
            </figcaption>
          </figure>
        </div>

        <div className="grid content-start gap-10 lg:col-span-5 lg:col-start-7 lg:row-start-2">
          <div
            className={cn(
              'flex items-center gap-3 text-label uppercase',
              paper ? 'text-black/60' : 'text-muted-foreground',
            )}
          >
            <span
              className={cn(
                'size-2 rounded-full',
                paper ? 'bg-ink' : 'bg-paper',
              )}
              aria-hidden="true"
            />
            <span>{content.availability}</span>
          </div>
          <div
            className={cn(
              'grid gap-6 text-base leading-relaxed sm:text-lg',
              paper ? 'text-black/65' : 'text-muted-foreground',
            )}
          >
            {content.paragraphs.map((paragraph) => (
              <RevealText as="p" key={paragraph}>
                {paragraph}
              </RevealText>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
