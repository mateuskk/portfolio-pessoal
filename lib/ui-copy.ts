export type LanguageCode = 'en' | 'pt';

/**
 * Everything the interface says that is not content.
 *
 * Kept in one object rather than scattered through the components so that a
 * missing translation is a type error rather than a stray English word noticed
 * by a reader. The functions are here for the same reason: a label built by
 * gluing a name onto a fragment has a different word order in the two
 * languages, and only the dictionary knows which.
 */
export type UiCopy = {
  skipToContent: string;
  loading: string;
  primaryNavigation: string;
  mobileNavigation: string;
  openMenu: string;
  closeMenu: string;
  menuTitle: string;
  navigationTitle: string;
  backToTop: string;
  home: string;
  language: string;
  siteLanguage: string;
  seeProjects: string;
  aboutHeading: string;
  capabilities: string;
  stackTitle: string;
  technologyStack: string;
  groupTechnologies: (group: string) => string;
  projectsEyebrow: string;
  selectedWork: string;
  allSelectedProjects: string;
  browseAllProjects: string;
  projectTechnologies: (project: string) => string;
  technologyFallback: (technology: string) => string;
  viewRepository: string;
  viewProjectRepository: (project: string) => string;
  previousProject: string;
  nextProject: string;
  projectCounter: (index: number, total: number) => string;
  contactLineOne: string;
  contactLineTwo: string;
  socialLinks: string;
  connect: string;
  copyUsername: string;
  copied: string;
  opensInNewTab: string;
};

export const UI_COPY: Record<LanguageCode, UiCopy> = {
  en: {
    skipToContent: 'Skip to content',
    loading: 'Loading portfolio',
    primaryNavigation: 'Primary navigation',
    mobileNavigation: 'Mobile navigation',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    menuTitle: 'Menu / Portfolio 2026',
    navigationTitle: 'Navigation',
    backToTop: 'Back to top',
    home: 'Home',
    language: 'Language',
    siteLanguage: 'Site language',
    seeProjects: 'See projects',
    aboutHeading: 'About',
    capabilities: 'Capabilities',
    stackTitle: 'Stack & tools',
    technologyStack: 'Technology stack',
    groupTechnologies: (group) => `${group} technologies`,
    projectsEyebrow: 'Projects',
    selectedWork: 'Selected work',
    allSelectedProjects: 'All selected projects',
    browseAllProjects: 'Browse all selected projects',
    projectTechnologies: (project) => `${project} technologies`,
    technologyFallback: (technology) =>
      `${technology} is part of this project's technology stack.`,
    viewRepository: 'View repository',
    viewProjectRepository: (project) => `View ${project} repository`,
    previousProject: 'Previous project',
    nextProject: 'Next project',
    projectCounter: (index, total) =>
      `Project ${String(index).padStart(2, '0')} / ${String(total).padStart(2, '0')}`,
    contactLineOne: 'Have a project in mind?',
    contactLineTwo: "Let's make it real.",
    socialLinks: 'Social links',
    connect: 'Connect',
    copyUsername: 'Copy username',
    copied: 'Copied',
    opensInNewTab: ' (opens in a new tab)',
  },
  pt: {
    skipToContent: 'Ir para o conteúdo',
    loading: 'Carregando portfólio',
    primaryNavigation: 'Navegação principal',
    mobileNavigation: 'Navegação mobile',
    openMenu: 'Abrir menu',
    closeMenu: 'Fechar menu',
    menuTitle: 'Menu / Portfólio 2026',
    navigationTitle: 'Navegação',
    backToTop: 'Voltar ao topo',
    home: 'Início',
    language: 'Idioma',
    siteLanguage: 'Idioma do site',
    seeProjects: 'Ver projetos',
    aboutHeading: 'Sobre',
    capabilities: 'Competências',
    stackTitle: 'Stack & ferramentas',
    technologyStack: 'Stack de tecnologias',
    groupTechnologies: (group) => `Tecnologias de ${group.toLowerCase()}`,
    projectsEyebrow: 'Projetos',
    selectedWork: 'Trabalhos selecionados',
    allSelectedProjects: 'Todos os projetos selecionados',
    browseAllProjects: 'Ver todos os projetos selecionados',
    projectTechnologies: (project) => `Tecnologias de ${project}`,
    technologyFallback: (technology) =>
      `${technology} faz parte da stack deste projeto.`,
    viewRepository: 'Ver repositório',
    viewProjectRepository: (project) => `Ver repositório de ${project}`,
    previousProject: 'Projeto anterior',
    nextProject: 'Próximo projeto',
    projectCounter: (index, total) =>
      `Projeto ${String(index).padStart(2, '0')} / ${String(total).padStart(2, '0')}`,
    contactLineOne: 'Tem um projeto em mente?',
    contactLineTwo: 'Vamos torná-lo real.',
    socialLinks: 'Redes sociais',
    connect: 'Acessar',
    copyUsername: 'Copiar usuário',
    copied: 'Copiado',
    opensInNewTab: ' (abre em uma nova aba)',
  },
};
