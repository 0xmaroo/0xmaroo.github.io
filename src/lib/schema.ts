import { getRelativeLocaleUrl } from 'astro:i18n';
import { site } from '../config/site';
import { isRealProof } from './proof';
import type { Language } from '../i18n/ui';

/**
 * JSON-LD builders (plan/05 Phase 5), serialised by src/components/seo/JsonLd.astro.
 * Emitted per page, no duplicates: WebSite on the home of each locale only,
 * Person on home + About, BreadcrumbList on writeup / project / nested archive
 * pages. TechArticle/CreativeWork stay hand-built in their layouts where the
 * entry data lives.
 */

export type JsonLdNode = Record<string, unknown>;

/**
 * Person — sameAs carries ONLY verified profile URLs (plan/08 §8.2: no proof,
 * no render). Both entries in site.social are owner-supplied; the proof gate
 * keeps a future blank value from shipping an empty or partial list.
 */
export const personSchema = (knowsAbout: string[] = []): JsonLdNode => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: site.brand,
  sameAs: [site.social.github, site.social.linkedin].filter(isRealProof),
  // Derived from what the site actually documents, never asserted: the CWE ids
  // of published writeups and the arsenal's capability domains. It grows with
  // the content instead of being a claim someone has to maintain. `alumniOf`
  // from §7.2 is deliberately absent — that is owner biography, not derivable.
  ...(knowsAbout.length > 0 ? { knowsAbout } : {}),
});

/**
 * WebSite — home page of each locale only.
 *
 * `potentialAction` (plan/07 §7.2) points at this locale's search page, which
 * reads `?q=` on load and keeps it in the URL, so the target is a real, working
 * entry point rather than a declaration.
 */
export const websiteSchema = (lang: Language, siteUrl: URL): JsonLdNode => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: site.brand,
  url: new URL(getRelativeLocaleUrl(lang, '/'), siteUrl).href,
  inLanguage: lang,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${new URL(getRelativeLocaleUrl(lang, '/search'), siteUrl).href}?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
});

export interface Crumb {
  /** Localized label — always a t() value, never a string literal (rule 3). */
  name: string;
  /** Locale-independent path (plan/02 §2.2); omitted only by a trailing crumb. */
  path?: string;
}

/** BreadcrumbList — trail built from getRelativeLocaleUrl() only (rule 4). */
export const breadcrumbSchema = (lang: Language, siteUrl: URL, crumbs: Crumb[]): JsonLdNode => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((crumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: crumb.name,
    // JSON.stringify drops the key when a trailing crumb has no path.
    item: crumb.path ? new URL(getRelativeLocaleUrl(lang, crumb.path), siteUrl).href : undefined,
  })),
});
