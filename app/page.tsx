import { AboutSection } from "@/components/about/about-section";
import { Hero } from "@/components/hero/hero";
import { Navbar } from "@/components/navigation/navbar";
import { ProjectsSection } from "@/components/projects/projects-section";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";
import { StackSection } from "@/components/stack/stack-section";
import { portfolioContent } from "@/content/portfolio";

export default function Home() {
  return (
    <SmoothScrollProvider>
      <Navbar
        items={portfolioContent.navigation}
        initials={portfolioContent.person.initials}
        email={portfolioContent.contact.email}
      />
      <main id="main-content" className="overflow-clip">
        <Hero content={portfolioContent.person} />
        <AboutSection content={{ ...portfolioContent.about, availability: portfolioContent.person.availability }} />
        <StackSection items={portfolioContent.stack} />
        <ProjectsSection projects={portfolioContent.projects} />
      </main>

      <footer className="flex flex-col gap-3 border-t border-white/15 px-page py-8 text-label uppercase text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Seu Nome</p>
        <a className="focus-ring transition-colors hover:text-paper" href="#main-content">Back to top ↑</a>
      </footer>
    </SmoothScrollProvider>
  );
}
