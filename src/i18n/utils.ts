import { ui, defaultLang, type Language, type UIKey } from './ui';

export function getLangFromUrl(url: URL): Language {
  const [, lang] = url.pathname.split('/');
  if (lang === 'ar') return 'ar';
  return defaultLang;
}

export function getOtherLang(lang: Language): Language {
  return lang === 'en' ? 'ar' : 'en';
}

export function useTranslations(lang: Language) {
  return function t(key: UIKey): string {
    return ui[lang][key] ?? ui[defaultLang][key];
  };
}
