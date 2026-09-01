import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  index: string;
  eyebrow: string;
  title: string;
  className?: string;
};

export function SectionHeading({ index, eyebrow, title, className }: SectionHeadingProps) {
  return (
    <header className={cn("grid gap-5 lg:grid-cols-12", className)}>
      <div className="flex items-start gap-5 text-label uppercase text-muted-foreground lg:col-span-3">
        <span aria-hidden="true">[ {index} ]</span>
        <span>{eyebrow}</span>
      </div>
      <h2 className="font-serif text-section leading-[0.9] tracking-[-0.055em] lg:col-span-9">
        {title}
      </h2>
    </header>
  );
}
