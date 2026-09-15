import { describe, expect, it } from "vitest";

import { technologyCatalog } from "@/lib/technology-catalog";
import { portfolioContent } from "./portfolio";

describe("portfolio content", () => {
  it("keeps all navigation targets and complete projects in one source", () => {
    expect(portfolioContent.navigation.map((item) => item.href)).toEqual([
      "#about",
      "#stack",
      "#projects",
      "#contact",
    ]);
    expect(portfolioContent.projects).toHaveLength(4);

    for (const project of portfolioContent.projects) {
      expect(project.title.length).toBeGreaterThan(2);
      expect(project.summary.length).toBeGreaterThan(20);
      expect(project.stack.length).toBeGreaterThan(1);
    }
  });

  /**
   * A tool a project names has to be one the catalog knows.
   *
   * `getTechnologyMeta` answers an unknown name rather than throwing: it hands
   * back no icon and a sentence assembled from the name itself. That is the
   * right behaviour at runtime and the wrong thing to ship, because the chip
   * still renders and the only tell is one mark missing from a row of six.
   * Caught here instead, where the name is written.
   */
  it("names only tools the catalog can draw and describe", () => {
    const unknown = portfolioContent.projects.flatMap((project) =>
      project.stack
        .filter((tool) => !(tool in technologyCatalog))
        .map((tool) => `${project.slug}: ${tool}`),
    );

    expect(unknown).toEqual([]);
  });

  it("uses the published repositories and verified technology stacks", () => {
    expect(
      portfolioContent.projects.map(({ slug, repository, stack }) => ({
        slug,
        repository,
        stack,
      })),
    ).toEqual([
      {
        slug: "meu-financeiro",
        repository: "https://github.com/mateuskk/app-financas",
        stack: [
          "Next.js",
          "TypeScript",
          "Tailwind CSS",
          "shadcn/ui",
          "Supabase",
          "PostgreSQL",
          "Recharts",
        ],
      },
      {
        slug: "sabor-e-mesa",
        repository:
          "https://github.com/mateuskk/Sistema-de-cadastro-de-reservas-de-um-restaurante",
        stack: ["Python", "Django", "SQLite", "Tailwind CSS"],
      },
      {
        slug: "wayne-industries",
        repository:
          "https://github.com/mateuskk/sistema-de-controle-de-acesso-e-gestao-interna",
        stack: [
          "React",
          "JavaScript",
          "Python",
          "Flask",
          "SQLAlchemy",
          "JWT",
        ],
      },
      {
        slug: "portfolio-fullstack",
        repository: "https://github.com/mateuskk/portfolio-pessoal",
        stack: [
          "React",
          "TypeScript",
          "Next.js",
          "Tailwind CSS",
          "Motion",
          "Three.js",
        ],
      },
    ]);
  });
});
