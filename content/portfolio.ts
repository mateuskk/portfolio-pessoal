import {
  technologyCatalog,
  type TechnologyMeta,
} from '@/lib/technology-catalog';

export type NavItem = {
  label: string;
  href: `#${string}`;
};

export type Project = {
  slug: string;
  title: string;
  year: string;
  role: string;
  summary: string;
  stack: string[];
  href?: string;
  repository?: string;
  /**
   * Screenshot under `public/projects/`. Falls back to the generative art in
   * `artDirection` if the file is not there yet, so a missing screenshot is a
   * placeholder rather than a broken image.
   */
  image: string;
  artDirection: 'orbital' | 'grid' | 'wave' | 'type';
  /**
   * The dominant colour of the screenshot, used to tint the stage behind it as
   * the project comes round. Kept muted and laid on at low alpha — these sit
   * against near-black, where a saturated hue shouts.
   */
  accent: string;
};

export type StackItem = TechnologyMeta;

/**
 * One band of the stack panel. Carried a prose summary per band once; it was
 * four aphorisms of near-identical length that repeated what the list below
 * already said, which is the shape generated copy takes. The label carries the
 * band now, and the detail lives on the individual tools.
 */
export type StackGroup = {
  label: string;
  items: StackItem[];
};

export type PortfolioContent = {
  person: {
    name: string;
    initials: string;
    role: string;
    intro: string;
    location: string;
    availability: string;
    /** Path to the portrait image. Null renders the placeholder plate. */
    portrait: string | null;
  };
  navigation: NavItem[];
  about: {
    statement: string;
    paragraphs: string[];
  };
  /**
   * The headline set, sized for the marquee rails — eight or so names that
   * still read at `clamp(2.5rem, 5.6vw, 6rem)`. The full inventory lives in
   * `stackGroups`; these two are curated separately on purpose.
   */
  stack: string[];
  stackGroups: StackGroup[];
  projects: Project[];
  contact: {
    email: string;
    linkedin: string;
    github: string;
  };
};

export const portfolioContent: PortfolioContent = {
  person: {
    name: 'Mateus Bastos',
    initials: 'MB',
    // Shown twice: as the hero's h1, where the last word is set in the
    // editorial serif, and on the hanging badge under the name.
    role: 'FullStack Developer',
    intro:
      "Hi, I'm Mateus Bastos, a FullStack Developer with a real appetite for building AI agents and automations.",
    location: 'Salvador, BA',
    availability: 'Looking for my first opportunity in tech',
    portrait: '/images/mateus-bastos.png',
  },
  navigation: [
    { label: 'About', href: '#about' },
    { label: 'Stack', href: '#stack' },
    { label: 'Projects', href: '#projects' },
    { label: 'Contact', href: '#contact' },
  ],
  about: {
    statement:
      "I'm a _FullStack Developer_ still learning the craft, with a real appetite for **technology** and what can be built with it.",
    paragraphs: [
      "I work across the **front and the back** of a project, and I'm still learning both properly. I care about code that stays clear, and about understanding _why_ something works rather than only that it does.",
      "Most of my interest sits in **automation and AI agents**, building things that take work off people's hands. Every project is a reason to pick up something new.",
    ],
  },
  stack: [
    'TypeScript',
    'React',
    'Next.js',
    'Tailwind CSS',
    'Python',
    'PostgreSQL',
    'Supabase',
    'JavaScript',
  ],
  /**
   * The bands follow the CV's own headings, in its order.
   *
   * Only tools with a brand mark are listed: a row whose icon falls back to the
   * neutral ring reads as a gap in a grid built around marks. REST APIs is the
   * deliberate exception — it is the one entry that is a contract rather than a
   * product, so there is no mark to be missing.
   *
   * Descriptions are the one thing the CV does not supply, and the hover panel
   * needs a line per tool, so they are kept flat and factual rather than making
   * a claim the CV does not.
   */
  stackGroups: [
    {
      label: 'Programming languages',
      items: [
        technologyCatalog.JavaScript,
        technologyCatalog.TypeScript,
        technologyCatalog.Python,
      ],
    },
    {
      label: 'Frameworks & libraries',
      items: [
        technologyCatalog.React,
        technologyCatalog['Next.js'],
        technologyCatalog['Node.js'],
        technologyCatalog.Flask,
      ],
    },
    {
      label: 'Web development',
      items: [
        technologyCatalog.HTML,
        technologyCatalog.CSS,
        technologyCatalog['Tailwind CSS'],
        technologyCatalog['REST APIs'],
      ],
    },
    {
      label: 'Databases',
      items: [
        technologyCatalog.PostgreSQL,
        technologyCatalog.MySQL,
        technologyCatalog.Supabase,
      ],
    },
    {
      label: 'Cloud & deploy',
      items: [technologyCatalog.Cloudflare],
    },
    {
      label: 'Version control',
      items: [technologyCatalog.Git, technologyCatalog.GitHub],
    },
    {
      /**
       * The level belongs in the name, not only in the hover panel: the panel
       * is an affordance for a pointer, and on a phone there is nothing to
       * hover with — the row would then read just "English" and say nothing.
       */
      label: 'Languages',
      items: [
        {
          name: 'English (Intermediate)',
          icon: null,
          description: 'Intermediate level.',
        },
      ],
    },
  ],
  projects: [
    {
      slug: 'meu-financeiro',
      title: 'Meu Financeiro',
      year: '2026',
      role: 'Product & Development',
      summary:
        'A personal finance dashboard. Income and spending in one place, broken down by category, with the full transaction history behind it.',
      stack: [
        'Next.js',
        'TypeScript',
        'Tailwind CSS',
        'shadcn/ui',
        'Supabase',
        'PostgreSQL',
        'Recharts',
      ],
      repository: 'https://github.com/mateuskk/app-financas',
      image: '/projects/meu-financeiro.png',
      artDirection: 'orbital',
      accent: '#60A5FA',
    },
    {
      slug: 'sabor-e-mesa',
      title: 'Sabor & Mesa',
      year: '2026',
      role: 'Design & Development',
      summary:
        'A restaurant reservation system built around who is using it: front of house books, waiters seat, managers read the numbers.',
      stack: ['Python', 'Django', 'SQLite', 'Tailwind CSS'],
      repository:
        'https://github.com/mateuskk/Sistema-de-cadastro-de-reservas-de-um-restaurante',
      image: '/projects/sabor-e-mesa.png',
      artDirection: 'grid',
      accent: '#FB923C',
    },
    {
      slug: 'wayne-industries',
      title: 'Wayne Industries',
      year: '2025',
      role: 'Frontend & Auth',
      summary:
        'An internal management system. Authentication, sessions and role-gated access, the unglamorous half that everything else rests on.',
      stack: ['React', 'JavaScript', 'Python', 'Flask', 'SQLAlchemy', 'JWT'],
      repository:
        'https://github.com/mateuskk/sistema-de-controle-de-acesso-e-gestao-interna',
      image: '/projects/wayne-industries.png',
      artDirection: 'wave',
      accent: '#FACC15',
    },
    {
      slug: 'portfolio-fullstack',
      title: 'Portfolio',
      year: '2026',
      role: 'Design & Development',
      summary:
        'This site. A monochrome landing page for the stack and the work, with the scroll doing most of the talking.',
      /*
        What this page is actually built out of, rather than the three headline
        names it carried before. Every entry here is in the technology catalog,
        which is what gives each chip its mark and the sentence behind it: a
        name the catalog does not know falls back to a generic line and no icon,
        and one chip in a row of six wearing neither reads as an oversight.
      */
      stack: [
        'React',
        'TypeScript',
        'Next.js',
        'Tailwind CSS',
        'Motion',
        'Three.js',
      ],
      repository: 'https://github.com/mateuskk/portfolio-pessoal',
      image: '/projects/portfolio-fullstack.png',
      artDirection: 'type',
      accent: '#E5E5E5',
    },
  ],
  contact: {
    email: 'msbastos.bastos@gmail.com',
    linkedin: 'https://linkedin.com/in/mateus-bastos-39615228b',
    github: 'https://github.com/mateuskk',
  },
};
