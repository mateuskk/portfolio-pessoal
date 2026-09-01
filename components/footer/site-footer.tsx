type SiteFooterProps = {
  name: string;
  location: string;
};

export function SiteFooter({ name, location }: SiteFooterProps) {
  return (
    <footer className="border-t border-black/20 bg-paper px-page py-7 text-ink">
      <div className="grid gap-5 text-label uppercase tracking-[0.14em] sm:grid-cols-3 sm:items-center">
        <p>© {new Date().getFullYear()} {name}</p>
        <p className="text-black/55 sm:text-center">{location}</p>
        <a className="focus-ring w-fit border-b border-black/25 pb-1 transition-colors hover:border-black sm:justify-self-end" href="#main-content">
          Back to top ↑
        </a>
      </div>
    </footer>
  );
}
