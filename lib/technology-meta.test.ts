import { describe, expect, it } from 'vitest';

import { technologyCatalog } from '@/lib/technology-catalog';
import { getTechnologyMetaIn } from '@/lib/technology-meta';
import { UI_COPY } from '@/lib/ui-copy';

const fallback = UI_COPY.en.technologyFallback;

describe('getTechnologyMetaIn', () => {
  it('describes a tool in the language the page is set to', () => {
    expect(getTechnologyMetaIn('en', 'React', fallback).description).toBe(
      'Interfaces built from components.',
    );
    expect(getTechnologyMetaIn('pt', 'React', fallback).description).toBe(
      'Interfaces construídas a partir de componentes.',
    );
  });

  it('keeps the name and the icon fixed across languages', () => {
    const en = getTechnologyMetaIn('en', 'Three.js', fallback);
    const pt = getTechnologyMetaIn('pt', 'Three.js', UI_COPY.pt.technologyFallback);

    expect(pt.name).toBe(en.name);
    expect(pt.icon).toBe(en.icon);
    expect(pt.description).not.toBe(en.description);
  });

  /**
   * The bug this function exists for. A project names its tools as bare
   * strings, so the chips resolve them at render time; before, that resolution
   * ignored the language entirely and every panel in the projects section
   * stayed in English.
   */
  it('translates every tool the catalog knows, not a subset of them', () => {
    const untranslated = Object.keys(technologyCatalog).filter(
      (name) =>
        getTechnologyMetaIn('pt', name, fallback).description ===
        getTechnologyMetaIn('en', name, fallback).description,
    );

    expect(untranslated).toEqual([]);
  });

  it('answers an unknown tool in that language rather than throwing', () => {
    expect(
      getTechnologyMetaIn('pt', 'Erlang', UI_COPY.pt.technologyFallback),
    ).toEqual({
      name: 'Erlang',
      icon: null,
      description: 'Erlang faz parte da stack deste projeto.',
    });
  });

  /**
   * Better a real description in the wrong language than the generic sentence:
   * a tool present in one catalog and missing from the other still arrives
   * with its icon.
   */
  it('falls through to English before it gives up', () => {
    expect(
      getTechnologyMetaIn('pt', 'Django', UI_COPY.pt.technologyFallback).icon,
    ).toBe('django');
  });
});
