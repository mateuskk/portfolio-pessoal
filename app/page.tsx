import { AboutSection } from "@/components/about/about-section";
import { Hero } from "@/components/hero/hero";
import { Navbar } from "@/components/navigation/navbar";
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

        <section id="projects" className="border-t border-white/15 px-page py-24 lg:py-36">
          <div className="grid gap-10 lg:grid-cols-12">
            <p className="text-label uppercase text-muted lg:col-span-3">[ 003 ]</p>
            <div className="lg:col-span-9">
              <h2 className="text-section leading-none tracking-[-0.055em]">Selected <span className="font-serif font-normal italic">work</span></h2>
              <div className="mt-16 grid min-h-[22rem] content-between border border-white/15 bg-graphite p-6 lg:min-h-[30rem] lg:p-10">
                <div className="flex justify-between text-label uppercase text-muted"><span>Obsidian</span><span>01 / 04</span></div>
                <div>
                  <p className="max-w-md text-base text-muted">A monochrome product experience built around clarity, pace, and meaningful interaction.</p>
                  <p className="mt-5 text-3xl tracking-[-0.04em] lg:text-5xl">Design &amp; Development</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-col gap-3 border-t border-white/15 px-page py-8 text-label uppercase text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Seu Nome</p>
        <a className="focus-ring transition-colors hover:text-paper" href="#main-content">Back to top ↑</a>
      </footer>
    </SmoothScrollProvider>
  );
}
