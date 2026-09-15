"use client";

import { ContactSection } from "@/components/contact/contact-section";
import { SiteFooter } from "@/components/footer/site-footer";
import { HeroAboutTransition } from "@/components/hero/hero-about-transition";
import { LoadingScreen } from "@/components/loading/loading-screen";
import { ArcRevealProvider } from "@/components/navigation/arc-reveal";
import { Navbar } from "@/components/navigation/navbar";
import { SkipLink } from "@/components/navigation/skip-link";
import { useLanguage } from "@/components/providers/language-provider";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";
import { StackProjectsScene } from "@/components/stack-projects/stack-projects-scene";

/**
 * The page, once the language is known.
 *
 * Split out from the route so that the content can be chosen in the browser
 * without a reload. Every section keeps the props it already had — the content
 * object is simply the one the reader picked, which is why switching language
 * touched none of their signatures.
 */
export function Site() {
  const { content } = useLanguage();

  return (
    <SmoothScrollProvider>
      <ArcRevealProvider>
        <LoadingScreen />
        <SkipLink />
        <Navbar items={content.navigation} initials={content.person.initials} />
        <main id="main-content" className="overflow-clip" tabIndex={-1}>
          <HeroAboutTransition person={content.person} about={content.about} />
          <StackProjectsScene
            groups={content.stackGroups}
            items={content.stack}
            projects={content.projects}
          />
          <ContactSection contact={content.contact} />
        </main>

        <SiteFooter name={content.person.name} />
      </ArcRevealProvider>
    </SmoothScrollProvider>
  );
}
