import type { Language } from '../i18n/ui';

export const site = {
  brand: '0xMARO',
  domain: 'https://0xmaro.dev',
  /** Public source repo — /security links every claim to the file behind it. */
  repo: 'https://github.com/0xmaroo/0xmaroo.github.io',
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
  // F-06 routes are in place, so the section can be enabled — but it stays out
  // of the nav until the stream has content worth a nav slot.
  notes: { enabled: true, inNav: false },
  // Routes stay built; the nav slot waits until the section has published
  // content — an empty page one click from every page reads as abandoned.
  // Flip back to true with the first published project / proven station.
  projects: { enabled: true, inNav: false },
  labs: { enabled: true, inNav: false },
  arsenal: { enabled: true, inNav: true },
  journey: { enabled: true, inNav: false },
  uses: { enabled: true, inNav: false },
  hire: { enabled: false, inNav: false },
  about: { enabled: true, inNav: true },
  search: { enabled: true, inNav: false },
  // plan/09 F-13 — linked from the footer, not the nav.
  security: { enabled: true, inNav: false },
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
  security: '/security',
};

/** Default page meta per locale. */
export const siteDescription: Record<Language, string> = {
  en: 'Application security, written by someone who ships the code. Every writeup ends with a fix.',
  ar: 'أمن تطبيقات مكتوب بقلم واحد بيكتب الكود نفسه. كل تحليل بينتهي بإصلاح حقيقي.',
};
