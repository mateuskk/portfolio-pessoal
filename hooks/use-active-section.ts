"use client";

import { useEffect, useState } from "react";

export function useActiveSection(ids: string[]) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const idKey = ids.join("|");

  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;

    const sectionIds = idKey.split("|").filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;
        setActiveSection(visible[visible.length - 1].target.id);
      },
      { rootMargin: "-35% 0px -55%", threshold: [0, 0.25, 0.6] },
    );

    const sections = sectionIds.map((id) => document.getElementById(id)).filter((section): section is HTMLElement => Boolean(section));
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [idKey]);

  return activeSection;
}
