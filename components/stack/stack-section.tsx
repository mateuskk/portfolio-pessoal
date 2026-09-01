"use client";

import { SectionHeading } from "@/components/ui/section-heading";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";
import { StackMarquee } from "./stack-marquee";

type StackSectionProps = {
  items: string[];
};

export function StackSection({ items }: StackSectionProps) {
  const reduceMotion = useReducedMotionPreference();

  return (
    <section id="stack" className="border-t border-white/15 py-24 sm:py-28 lg:py-40">
      <SectionHeading className="px-page" index="002" eyebrow="Capabilities" title="Stack & tools" />

      <ul aria-label="Technology stack" className="sr-only">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>

      <div className="mt-16 grid gap-3 lg:mt-24">
        {reduceMotion ? (
          <div aria-hidden="true" className="flex flex-wrap gap-x-7 gap-y-4 border-y border-white/15 px-page py-8">
            {items.map((item) => (
              <span key={item} className="font-serif text-4xl italic tracking-[-0.04em] sm:text-6xl">{item}</span>
            ))}
          </div>
        ) : (
          <>
            <StackMarquee items={items} direction={1} />
            <StackMarquee items={[...items].reverse()} direction={-1} />
          </>
        )}
      </div>

      <div className="mt-8 flex justify-between px-page text-label uppercase text-muted">
        <span>Selected technologies</span><span>Scroll responsive / Hover to pause</span>
      </div>
    </section>
  );
}
