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
 * Locale-independent paths (plan/02 §2.2) make the same pathname valid in both.
 */
export function localeHrefs(pathname: string): Record<Language, string> {
  // Strip the prefix of the page we are ON (only non-default locales carry
  // one). Stripping the target's prefix instead left `/ar/` in the English
  // link, so every Arabic page's EN button pointed back at itself.
  const prefixes = Object.keys(ui).filter((l) => l !== defaultLang);
  const bare = pathname
    .replace(/\/$/, '')
    .replace(new RegExp(`^/(?:${prefixes.join('|')})(?=/|$)`), '');
  const arg = bare.length > 0 ? bare.slice(1) : undefined;
  return {
    en: getRelativeLocaleUrl('en', arg),
    ar: getRelativeLocaleUrl('ar', arg),
  };
}

export function getOtherLang(lang: Language): Language {
  return lang === 'en' ? 'ar' : 'en';
}

export function useTranslations(lang: Language) {
  return function t(key: UIKey): string {
    return ui[lang][key] ?? ui[defaultLang][key];
  };
}
