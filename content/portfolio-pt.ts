import { portfolioContent, type PortfolioContent, type Project } from '@/content/portfolio';
import { technologyCatalogPt } from '@/lib/technology-catalog-pt';

/**
 * The site in Portuguese.
 *
 * Derived from the English content rather than written out again: everything
 * that is not prose — links, images, slugs, accents, the order of things — has
 * exactly one home, and only the words are restated here. Two full copies of
 * this object would drift the first time a repository URL changed.
 */

/** Prose that belongs to a project, keyed by the slug that never translates. */
const PROJECT_COPY: Record<string, Pick<Project, 'role' | 'summary'>> = {
  'meu-financeiro': {
    role: 'Produto & Desenvolvimento',
    summary:
      'Um painel de finanças pessoais. Entradas e gastos num lugar só, separados por categoria, com todo o histórico de transações por trás.',
  },
  'sabor-e-mesa': {
    role: 'Design & Desenvolvimento',
    summary:
      'Um sistema de reservas para restaurante construído em torno de quem o usa: o salão marca, os garçons acomodam, a gerência lê os números.',
  },
  'wayne-industries': {
    role: 'Frontend & Autenticação',
    summary:
      'Um sistema de gestão interna. Autenticação, sessões e acesso por perfil, a metade sem glamour sobre a qual todo o resto se apoia.',
  },
  'portfolio-fullstack': {
    role: 'Design & Desenvolvimento',
    summary:
      'Este site. Uma página monocromática para a stack e os trabalhos, com o scroll fazendo quase toda a conversa.',
  },
};

/** The stack bands, in the same order the English ones appear. */
const GROUP_LABELS = [
  'Linguagens de programação',
  'Frameworks & bibliotecas',
  'Desenvolvimento web',
  'Bancos de dados',
  'Cloud & deploy',
  'Controle de versão',
  'Idiomas',
];

export const portfolioContentPt: PortfolioContent = {
  ...portfolioContent,
  person: {
    ...portfolioContent.person,
    intro:
      'Olá, eu sou Mateus Bastos, Desenvolvedor FullStack, com grande interesse em criar agentes de IA e automações.',
    availability: 'Em busca da primeira oportunidade na área',
  },
  navigation: [
    { label: 'Sobre', href: '#about' },
    { label: 'Stack', href: '#stack' },
    { label: 'Projetos', href: '#projects' },
    { label: 'Contato', href: '#contact' },
  ],
  about: {
    statement:
      'Sou um _Desenvolvedor FullStack_ ainda aprendendo o ofício, com um apetite real por **tecnologia** e pelo que dá para construir com ela.',
    paragraphs: [
      'Trabalho no **front e no back** de um projeto, e ainda estou aprendendo os dois direito. Me importo com código que continua claro, e em entender _por que_ algo funciona, não só que funciona.',
      'A maior parte do meu interesse está em **automação e agentes de IA**, construir coisas que tiram trabalho das mãos das pessoas. Cada projeto é um motivo para aprender algo novo.',
    ],
  },
  stackGroups: portfolioContent.stackGroups.map((group, index) => ({
    label: GROUP_LABELS[index] ?? group.label,
    items: group.items.map((item) => technologyCatalogPt[item.name] ?? item),
  })),
  projects: portfolioContent.projects.map((project) => ({
    ...project,
    ...PROJECT_COPY[project.slug],
  })),
};
