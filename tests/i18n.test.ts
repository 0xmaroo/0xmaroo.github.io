import { describe, expect, it } from 'vitest';
import { localeHrefs } from '../src/i18n/utils';

describe('localeHrefs — the language switch', () => {
  it('sends an Arabic page to its English counterpart (regression: it pointed back at itself)', () => {
    expect(localeHrefs('/ar/about/')).toEqual({ en: '/about/', ar: '/ar/about/' });
  });

  it('sends an English page to its Arabic counterpart', () => {
    expect(localeHrefs('/writeups/some-post/')).toEqual({
      en: '/writeups/some-post/',
      ar: '/ar/writeups/some-post/',
    });
  });

  it('maps both home pages', () => {
    expect(localeHrefs('/')).toEqual({ en: '/', ar: '/ar/' });
    expect(localeHrefs('/ar/')).toEqual({ en: '/', ar: '/ar/' });
  });

  it('does not strip a path that merely starts with the letters "ar"', () => {
    expect(localeHrefs('/arsenal/')).toEqual({ en: '/arsenal/', ar: '/ar/arsenal/' });
  });

  it("sends a one-language page to the other locale's fallback, not a 404", () => {
    expect(localeHrefs('/writeups/en-only/', '/writeups')).toEqual({
      en: '/writeups/en-only/',
      ar: '/ar/writeups/',
    });
    expect(localeHrefs('/ar/notes/ar-only/', '/notes')).toEqual({
      en: '/notes/',
      ar: '/ar/notes/ar-only/',
    });
  });
});
