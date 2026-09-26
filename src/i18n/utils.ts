import { getRelativeLocaleUrl } from 'astro:i18n';
import { ui, defaultLang, type Language, type UIKey } from './ui';

export function getLangFromUrl(url: URL): Language {
  const [, lang] = url.pathname.split('/');
  if (lang === 'ar') return 'ar';
  return defaultLang;
}

/**
 * Href of the current page in each locale. Shared by LangSwitch and the
 * command palette so switching language never sends the visitor home.
 * Locale-independent paths (plan/02 §2.2) make the same pathname valid in both
 * — except for content that exists in one language only; see `fallback`.
 */
export function localeHrefs(pathname: string, fallback?: string): Record<Language, string> {
  // Strip the prefix of the page we are ON (only non-default locales carry
  // one). Stripping the target's prefix instead left `/ar/` in the English
  // link, so every Arabic page's EN button pointed back at itself.
  const prefixes = Object.keys(ui).filter((l) => l !== defaultLang);
  const bare = pathname
    .replace(/\/$/, '')
    .replace(new RegExp(`^/(?:${prefixes.join('|')})(?=/|$)`), '');
  const arg = bare.length > 0 ? bare.slice(1) : undefined;
  const hrefs: Record<Language, string> = {
    en: getRelativeLocaleUrl('en', arg),
    ar: getRelativeLocaleUrl('ar', arg),
  };
  // A page with no counterpart (an English-only writeup) sends the other
  // locale to `fallback` — its archive — instead of a 404.
  if (fallback !== undefined) {
    const other = getOtherLang(getLangFromUrl(new URL(pathname, 'https://x')));
    hrefs[other] = getRelativeLocaleUrl(other, fallback.replace(/^\//, ''));
  }
  return hrefs;
}

export function getOtherLang(lang: Language): Language {
  return lang === 'en' ? 'ar' : 'en';
}

export function useTranslations(lang: Language) {
  return function t(key: UIKey): string {
    return ui[lang][key] ?? ui[defaultLang][key];
  };
}
