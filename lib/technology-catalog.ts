import type { StackIconSlug } from '@/lib/stack-icons';

export type TechnologyMeta = {
  name: string;
  icon: StackIconSlug | 'recharts' | null;
  description: string;
};

export const technologyCatalog = {
  CSS: { name: 'CSS', icon: 'css', description: 'Layout and presentation.' },
  Django: {
    name: 'Django',
    icon: 'django',
    description: 'A batteries-included Python framework for web applications.',
  },
  Flask: {
    name: 'Flask',
    icon: 'flask',
    description: 'Small web services in Python.',
  },
  Git: {
    name: 'Git',
    icon: 'git',
    description: 'The history of every decision.',
  },
  GitHub: {
    name: 'GitHub',
    icon: 'github',
    description: 'Where the repositories live.',
  },
  HTML: {
    name: 'HTML',
    icon: 'html5',
    description: 'The structure under every page.',
  },
  JavaScript: {
    name: 'JavaScript',
    icon: 'javascript',
    description: 'The language the web runs on.',
  },
  JWT: {
    name: 'JWT',
    icon: 'jsonwebtokens',
    description: 'Signed tokens used to authenticate requests securely.',
  },
  Motion: {
    name: 'Motion',
    icon: 'framer',
    description: 'Animation and gesture tooling for React interfaces.',
  },
  MySQL: { name: 'MySQL', icon: 'mysql', description: 'Relational database.' },
  'Next.js': {
    name: 'Next.js',
    icon: 'nextdotjs',
    description: 'Routing, rendering and the build for React.',
  },
  PostgreSQL: {
    name: 'PostgreSQL',
    icon: 'postgresql',
    description: 'Relational database.',
  },
  Python: {
    name: 'Python',
    icon: 'python',
    description: 'Scripting, automation and AI work.',
  },
  React: {
    name: 'React',
    icon: 'react',
    description: 'Interfaces built from components.',
  },
  Recharts: {
    name: 'Recharts',
    icon: 'recharts',
    description: 'Composable charts built with React components.',
  },
  'REST APIs': {
    name: 'REST APIs',
    icon: null,
    description: 'The contract between client and server.',
  },
  'shadcn/ui': {
    name: 'shadcn/ui',
    icon: 'shadcnui',
    description: 'Accessible interface components owned by the application.',
  },
  SQLAlchemy: {
    name: 'SQLAlchemy',
    icon: 'sqlalchemy',
    description: 'A Python toolkit for relational data and object mapping.',
  },
  SQLite: {
    name: 'SQLite',
    icon: 'sqlite',
    description: 'A compact relational database stored in a single file.',
  },
  Supabase: {
    name: 'Supabase',
    icon: 'supabase',
    description: 'Postgres with auth and APIs on top.',
  },
  'Tailwind CSS': {
    name: 'Tailwind CSS',
    icon: 'tailwindcss',
    description: 'Styling that stays next to the markup it affects.',
  },
  'Three.js': {
    name: 'Three.js',
    icon: 'threedotjs',
    description: 'Real-time 3D graphics rendered in the browser.',
  },
  TypeScript: {
    name: 'TypeScript',
    icon: 'typescript',
    description: 'JavaScript with types checked before it runs.',
  },
  Vercel: {
    name: 'Vercel',
    icon: 'vercel',
    description: 'Deploys and preview builds.',
  },
  Netlify: {
    name: 'Netlify',
    icon: 'netlify',
    description: 'Deploys and preview builds.',
  },
} satisfies Record<string, TechnologyMeta>;

export function getTechnologyMeta(name: string): TechnologyMeta {
  return (
    technologyCatalog[name as keyof typeof technologyCatalog] ?? {
      name,
      icon: null,
      description: `${name} is part of this project's technology stack.`,
    }
  );
}
