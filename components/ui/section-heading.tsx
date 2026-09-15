import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  className?: string;
};

export function SectionHeading({ eyebrow, title, className }: SectionHeadingProps) {
  return (
    <header className={cn("grid gap-5 lg:grid-cols-12", className)}>
      <div className="text-label uppercase text-muted-foreground lg:col-span-3">{eyebrow}</div>
      <h2 className="font-display text-section font-medium leading-[0.9] tracking-[-0.05em] lg:col-span-9">
        {title}
      </h2>
    </header>
  );
}
