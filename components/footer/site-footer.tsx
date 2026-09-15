type SiteFooterProps = {
  name: string;
};

export function SiteFooter({ name }: SiteFooterProps) {
  return (
    /*
      `--footer-h` tall, and the contact section above subtracts the same
      variable from its own height so the two together come to one screen. The
      number lives in `globals.css` because both of them need it and a short
      screen changes it.

      No rule across the top: with the copyright reading as the bottom corner of
      that screen rather than as a separate band, a line would cut the
      composition in half.
    */
    <footer className="flex h-[var(--footer-h)] items-center justify-center bg-paper px-page text-ink">
      <p className="text-center text-label uppercase tracking-[0.14em]">
        © {new Date().getFullYear()} {name}
      </p>
    </footer>
  );
}
