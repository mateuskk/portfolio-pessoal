import { technologyCatalog, type TechnologyMeta } from '@/lib/technology-catalog';
import { technologyCatalogPt } from '@/lib/technology-catalog-pt';
import type { LanguageCode } from '@/lib/ui-copy';

/**
 * A tool as the reader's language has it.
 *
 * The stack section never needed this. Its groups arrive from the content
 * files, and the Portuguese one already maps every item through the translated
 * catalog before the component ever sees it. The project chips take a different
 * route: a project names its tools as bare strings, so they are looked up at
 * render time, and that lookup went straight to the English catalog whatever
 * the page was set to. The chips therefore kept their English descriptions in
 * Portuguese, which is only visible once a panel is open, which is why it went
 * unnoticed.
 *
 * The names are products and do not translate. Only the description moves.
 *
 * Deliberately not a function inside `lib/technology-catalog.ts`. The icon
 * generator reads `lib/*-catalog.ts` so that no file can name a mark it would
 * miss, and the Portuguese catalog is spelled to fall outside that glob;
 * importing it from within the English one would pull it back in and close an
 * import cycle at the same time.
 */
const CATALOGS: Record<LanguageCode, Record<string, TechnologyMeta | undefined>> = {
  en: technologyCatalog,
  pt: technologyCatalogPt,
};

/**
 * `fallbackDescription` comes from the caller rather than from here, because
 * the sentence for a tool the catalog has never heard of is interface copy and
 * belongs with the rest of it. Falling through English first means a tool
 * present in one catalog and missing from the other still arrives with its own
 * icon and a real description, rather than the generic line.
 */
export function getTechnologyMetaIn(
  language: LanguageCode,
  name: string,
  fallbackDescription: (name: string) => string,
): TechnologyMeta {
  return (
    CATALOGS[language][name] ??
    CATALOGS.en[name] ?? {
      name,
      icon: null,
      description: fallbackDescription(name),
    }
  );
}
