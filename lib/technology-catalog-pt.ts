import { technologyCatalog, type TechnologyMeta } from '@/lib/technology-catalog';

/**
 * The tools, said in Portuguese.
 *
 * Only the descriptions, and only ever derived: the names are products and do
 * not translate, and the icon slugs live in the English catalog alone. That
 * last part is deliberate — the icon generator reads `lib/*-catalog.ts` so that
 * no file can name a mark it would miss, and this file names none. It is
 * spelled `-catalog-pt` rather than `-catalog` for exactly that reason.
 */
const DESCRIPTIONS: Record<string, string> = {
  CSS: 'Layout e apresentação.',
  Django: 'Um framework Python completo para aplicações web.',
  Flask: 'Serviços web pequenos em Python.',
  Git: 'O histórico de cada decisão.',
  GitHub: 'Onde os repositórios vivem.',
  HTML: 'A estrutura sob toda página.',
  JavaScript: 'A linguagem que move a web.',
  JWT: 'Tokens assinados para autenticar requisições com segurança.',
  Motion: 'Animação e gestos para interfaces React.',
  MySQL: 'Banco de dados relacional.',
  'Next.js': 'Rotas, renderização e build para React.',
  PostgreSQL: 'Banco de dados relacional.',
  Python: 'Scripts, automação e trabalho com IA.',
  React: 'Interfaces construídas a partir de componentes.',
  Recharts: 'Gráficos compostos com componentes React.',
  'REST APIs': 'O contrato entre cliente e servidor.',
  'shadcn/ui': 'Componentes de interface acessíveis, de posse da aplicação.',
  SQLAlchemy: 'Um toolkit Python para dados relacionais e mapeamento objeto-relacional.',
  SQLite: 'Um banco relacional compacto, guardado num único arquivo.',
  Supabase: 'Postgres com autenticação e APIs por cima.',
  'Tailwind CSS': 'Estilo que fica ao lado da marcação que ele afeta.',
  'Three.js': 'Gráficos 3D em tempo real renderizados no navegador.',
  TypeScript: 'JavaScript com tipos verificados antes de rodar.',
  Vercel: 'Deploys e builds de pré-visualização.',
  Netlify: 'Deploys e builds de pré-visualização.',
};

/**
 * The one entry that is not a product.
 *
 * The level belongs in the name rather than only in the hover panel — a phone
 * has nothing to hover with, and the row would otherwise read just "Inglês".
 */
const LANGUAGE_ROW: TechnologyMeta = {
  name: 'Inglês (Intermediário)',
  icon: null,
  description: 'Nível intermediário.',
};

export const technologyCatalogPt: Record<string, TechnologyMeta> = {
  ...Object.fromEntries(
    Object.values(technologyCatalog).map((item) => [
      item.name,
      { ...item, description: DESCRIPTIONS[item.name] ?? item.description },
    ]),
  ),
  'English (Intermediate)': LANGUAGE_ROW,
};
