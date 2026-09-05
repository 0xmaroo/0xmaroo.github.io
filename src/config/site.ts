import type { Language } from '../i18n/ui';

export const site = {
  brand: '0xMARO',
  domain: 'https://0xmaro.dev',
  social: {
    // Owner-supplied and verified (plan/05 Phase 5): the sameAs allowlist for
    // JSON-LD and the proof-gated footer/About links. No third profile.
    github: 'https://github.com/0xmaroo',
    linkedin: 'https://www.linkedin.com/in/amar-mohamed-0xmaro',
  },
} as const;

interface SectionConfig {
  enabled: boolean;
  inNav: boolean;
}

/**
 * Master switch for whole sections (plan/04-features.md F-01).
 * `enabled: false` removes the section's routes and links everywhere.
 */
export const sections = {
  writeups: { enabled: true, inNav: true },
  notes: { enabled: true, inNav: false },
  projects: { enabled: true, inNav: true },
  labs: { enabled: true, inNav: false },
  arsenal: { enabled: true, inNav: true },
  journey: { enabled: true, inNav: true },
  uses: { enabled: true, inNav: false },
  hire: { enabled: false, inNav: false },
  about: { enabled: true, inNav: true },
  search: { enabled: true, inNav: false },
} as const satisfies Record<string, SectionConfig>;

export type SectionKey = keyof typeof sections;

/** Locale-independent paths (same slug in both languages, plan/02-architecture.md §2.2). */
export const sectionPaths: Record<SectionKey, string> = {
  writeups: '/writeups',
  notes: '/notes',
  projects: '/projects',
  labs: '/labs',
  arsenal: '/arsenal',
  journey: '/journey',
  uses: '/uses',
  hire: '/hire',
  about: '/about',
  search: '/search',
};

/** Default page meta per locale. */
export const siteDescription: Record<Language, string> = {
  en: 'Application security, written by someone who ships the code. Every writeup ends with a fix.',
  ar: 'أمن تطبيقات مكتوب بقلم واحد بيكتب الكود نفسه. كل تحليل بينتهي بإصلاح حقيقي.',
};
