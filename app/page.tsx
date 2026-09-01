import { AboutSection } from "@/components/about/about-section";
import { ContactSection } from "@/components/contact/contact-section";
import { SiteFooter } from "@/components/footer/site-footer";
import { Hero } from "@/components/hero/hero";
import { LoadingScreen } from "@/components/loading/loading-screen";
import { Navbar } from "@/components/navigation/navbar";
import { SkipLink } from "@/components/navigation/skip-link";
import { ProjectsSection } from "@/components/projects/projects-section";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";
import { StackSection } from "@/components/stack/stack-section";
import { portfolioContent } from "@/content/portfolio";

export default function Home() {
  return (
    <SmoothScrollProvider>
      <LoadingScreen />
      <SkipLink />
      <Navbar
        items={portfolioContent.navigation}
        initials={portfolioContent.person.initials}
        email={portfolioContent.contact.email}
      />
      <main id="main-content" className="overflow-clip" tabIndex={-1}>
        <Hero content={portfolioContent.person} />
        <AboutSection content={{ ...portfolioContent.about, availability: portfolioContent.person.availability }} />
        <StackSection items={portfolioContent.stack} />
        <ProjectsSection projects={portfolioContent.projects} />
        <ContactSection contact={portfolioContent.contact} />
      </main>

      <SiteFooter name={portfolioContent.person.name} location={portfolioContent.person.location} />
    </SmoothScrollProvider>
  );
}
