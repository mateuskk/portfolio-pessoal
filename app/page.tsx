import { Navbar } from "@/components/navigation/navbar";
import { portfolioContent } from "@/content/portfolio";

export default function Home() {
  return (
    <>
      <Navbar
        items={portfolioContent.navigation}
        initials={portfolioContent.person.initials}
        email={portfolioContent.contact.email}
      />
      <main id="main-content" className="overflow-clip">
        <section className="relative flex min-h-svh flex-col justify-between px-page pb-10 pt-28 lg:pb-14 lg:pt-36">
          <div className="hairline absolute inset-x-page top-24 lg:top-28" />
          <div className="grid gap-8 text-label uppercase lg:grid-cols-12">
            <p className="lg:col-span-3">Portfolio / 2026</p>
            <p className="text-muted lg:col-span-4 lg:col-start-9 lg:text-right">
              São Paulo, BR<br />Available for selected projects
            </p>
          </div>

          <div className="relative py-20 lg:py-24">
            <p className="mb-5 text-label uppercase text-muted">Seu Nome — Digital craft</p>
            <h1 className="max-w-[12ch] text-display font-medium leading-[0.82] tracking-[-0.07em]">
              Creative <span className="font-serif font-normal italic tracking-[-0.045em]">Developer</span>
            </h1>
            <p className="mt-8 max-w-md text-balance text-base leading-relaxed text-muted lg:ml-[50%] lg:text-lg">
              I shape precise digital experiences where technology, typography, and motion move as one.
            </p>
          </div>

          <div className="grid items-end gap-6 text-label uppercase lg:grid-cols-12">
            <a className="focus-ring group inline-flex w-fit items-center gap-3 lg:col-span-4" href="#projects">
              <span className="grid size-9 place-items-center rounded-full border border-white/25 transition-colors group-hover:bg-paper group-hover:text-ink">↓</span>
              Explore projects
            </a>
            <p className="text-muted lg:col-span-3 lg:col-start-10 lg:text-right">Scroll to discover</p>
          </div>
        </section>

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
    </>
  );
}
