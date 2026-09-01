import { MagneticLink } from "@/components/ui/magnetic-link";
import { RevealText } from "@/components/ui/reveal-text";
import type { PortfolioContent } from "@/content/portfolio";

type ContactSectionProps = {
  contact: PortfolioContent["contact"];
};

export function ContactSection({ contact }: ContactSectionProps) {
  const socialLinks = [
    { label: "LinkedIn", href: contact.linkedin },
    { label: "GitHub", href: contact.github },
  ];

  return (
    <section id="contact" className="relative overflow-hidden bg-paper px-page py-24 text-ink sm:py-28 lg:py-40">
      <div aria-hidden="true" className="absolute inset-x-page top-0 h-px bg-black/20" />
      <div className="grid gap-16 lg:grid-cols-12 lg:gap-y-28">
        <div className="flex items-start gap-5 text-label uppercase text-black/55 lg:col-span-3">
          <span aria-hidden="true">[ 004 ]</span>
          <span>Contact</span>
        </div>

        <h2 className="lg:col-span-9">
          <RevealText className="max-w-[12ch] font-serif text-[clamp(4rem,9vw,10rem)] leading-[0.82] tracking-[-0.065em]">
            Have a project in mind?
          </RevealText>
          <RevealText className="mt-5 max-w-[12ch] text-[clamp(3.2rem,8vw,9rem)] font-medium leading-[0.82] tracking-[-0.075em]">
            Let&apos;s make it real.
          </RevealText>
        </h2>

        <p className="max-w-xs text-base leading-relaxed text-black/60 lg:col-span-3">
          Available for selected collaborations, ambitious products, and thoughtful digital experiences.
        </p>

        <div className="grid gap-12 lg:col-span-9 lg:grid-cols-[1fr_auto] lg:items-end">
          <MagneticLink
            href={`mailto:${contact.email}`}
            className="group w-fit max-w-full text-[clamp(1.45rem,3.2vw,3.75rem)] leading-tight tracking-[-0.045em]"
          >
            <span className="break-all">{contact.email}</span>
            <span aria-hidden="true" className="mt-2 block h-[2px] origin-left bg-ink transition-transform duration-500 ease-expo-out group-hover:scale-x-50 group-focus-visible:scale-x-50" />
          </MagneticLink>

          <nav aria-label="Social links">
            <ul className="flex flex-wrap gap-x-7 gap-y-4 text-label uppercase tracking-[0.16em]">
              {socialLinks.map((link) => (
                <li key={link.label}>
                  <a
                    className="focus-ring group inline-flex items-center gap-2 border-b border-black/25 pb-1 transition-colors hover:border-black"
                    href={link.href}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {link.label}<span aria-hidden="true" className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span>
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </section>
  );
}
