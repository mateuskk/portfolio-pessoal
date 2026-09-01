export type NavItem = {
  label: string;
  href: `#${string}`;
};

export type Project = {
  slug: string;
  index: string;
  title: string;
  year: string;
  role: string;
  summary: string;
  stack: string[];
  href?: string;
  artDirection: "orbital" | "grid" | "wave" | "type";
};

export type PortfolioContent = {
  person: {
    name: string;
    initials: string;
    role: string;
    location: string;
    availability: string;
  };
  navigation: NavItem[];
  about: {
    statement: string;
    paragraphs: string[];
  };
  stack: string[];
  projects: Project[];
  contact: {
    email: string;
    linkedin: string;
    github: string;
  };
};

export const portfolioContent: PortfolioContent = {
  person: {
    name: "Seu Nome",
    initials: "SN",
    role: "Creative Developer",
    location: "São Paulo, BR",
    availability: "Available for selected projects",
  },
  navigation: [
    { label: "About", href: "#about" },
    { label: "Stack", href: "#stack" },
    { label: "Projects", href: "#projects" },
    { label: "Contact", href: "#contact" },
  ],
  about: {
    statement: "I turn complex ideas into digital experiences with clarity, character, and technical precision.",
    paragraphs: [
      "I am a creative developer focused on the space where design and engineering meet. I care about strong systems, thoughtful motion, and interfaces that feel as good as they perform.",
      "My work moves from early visual direction to production code, keeping every decision connected to the people who will use the final experience.",
    ],
  },
  stack: [
    "TypeScript",
    "React",
    "Next.js",
    "Tailwind CSS",
    "Motion",
    "Three.js",
    "Node.js",
    "Design Systems",
  ],
  projects: [
    {
      slug: "obsidian",
      index: "01",
      title: "Obsidian",
      year: "2026",
      role: "Design & Development",
      summary: "A monochrome product experience built around clarity, deliberate pacing, and meaningful interaction.",
      stack: ["Next.js", "Motion", "Three.js"],
      artDirection: "orbital",
    },
    {
      slug: "monolith",
      index: "02",
      title: "Monolith",
      year: "2026",
      role: "Frontend Architecture",
      summary: "An editorial platform with a precise modular system for publishing ambitious long-form stories.",
      stack: ["React", "TypeScript", "Design Systems"],
      artDirection: "grid",
    },
    {
      slug: "forma",
      index: "03",
      title: "Forma",
      year: "2025",
      role: "Interaction Design",
      summary: "A spatial interface that turns a complex creative workflow into a calm and intuitive visual process.",
      stack: ["Next.js", "WebGL", "Motion"],
      artDirection: "wave",
    },
    {
      slug: "sillage",
      index: "04",
      title: "Sillage",
      year: "2025",
      role: "Creative Direction",
      summary: "A restrained digital identity where expressive typography and subtle transitions carry the story.",
      stack: ["React", "TypeScript", "Content Strategy"],
      artDirection: "type",
    },
  ],
  contact: {
    email: "hello@example.com",
    linkedin: "https://linkedin.com/in/example",
    github: "https://github.com/example",
  },
};
