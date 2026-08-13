import type { CollectionEntry } from 'astro:content';

/**
 * The single content-filtering layer — plan/02-architecture.md §2.5.
 *
 * Every listing surface (archive, home, RSS, sitemap, search, related) reads
 * through `forSurface()`. No page may filter collection entries itself; that
 * is how a draft leaks into the RSS feed. When you want to hide a post you
 * change one line in its frontmatter and it disappears from every surface at
 * once.
 */

export type Writeup = CollectionEntry<'writeups'>;

/**
 * A surface is a place a post can appear. `direct` is the viewing context of
 * the post's own page (a direct link), which bypasses `unlisted`.
 */
export type Surface =
  | 'home'
  | 'archive'
  | 'rss'
  | 'search'
  | 'sitemap'
  | 'related'
  | 'direct';

export const isPublic = (entry: Writeup): boolean => !entry.data.visibility.draft;

/** Drafts are not built into the production output at all (plan/02 §2.4). */
export const buildsInProd = (entry: Writeup): boolean =>
  !(import.meta.env.PROD && entry.data.visibility.draft);

export const forSurface = (
  entries: Writeup[],
  surface: Surface,
  lang: Writeup['data']['lang']
): Writeup[] =>
  entries
    .filter(isPublic)
    .filter((e) => e.data.lang === lang)
    .filter((e) => !e.data.visibility.unlisted || surface === 'direct')
    .filter((e) => surface === 'direct' || !e.data.visibility.hideFrom.includes(surface))
    .sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());

/** Locale-independent slug derived from the on-disk id (`en/foo.mdx` → `foo`). */
export const slugOf = (entry: Writeup): string =>
  entry.id.replace(/\.mdx?$/, '').replace(/^[a-z]{2}\//, '');

/**
 * The counterpart post in the other language. Prefers the same-slug convention
 * (plan/02 §2.2), falling back to the explicit `translationOf` field.
 */
export const getTranslation = (entries: Writeup[], entry: Writeup): Writeup | undefined => {
  const other: Writeup['data']['lang'] = entry.data.lang === 'en' ? 'ar' : 'en';
  const sameSlug = entries.find((e) => e.data.lang === other && slugOf(e) === slugOf(entry));
  if (sameSlug) return sameSlug;
  if (entry.data.translationOf) {
    return entries.find((e) => e.data.lang === other && slugOf(e) === entry.data.translationOf);
  }
  return undefined;
};

/**
 * Sequential case numbers shown on cards ("CASE 014 · WEB"). Oldest writeup is
 * 001; new posts only ever append, so existing numbers never shift. Derived
 * from publication order across both languages — never hardcoded.
 */
export const caseNumbers = (entries: Writeup[]): Map<string, number> => {
  const earliest = new Map<string, Writeup>();
  for (const e of entries) {
    const slug = slugOf(e);
    const current = earliest.get(slug);
    if (!current || e.data.publishedAt < current.data.publishedAt) {
      earliest.set(slug, e);
    }
  }
  const byDate = [...earliest.values()].sort(
    (a, b) => a.data.publishedAt.getTime() - b.data.publishedAt.getTime()
  );
  const map = new Map<string, number>();
  byDate.forEach((e, i) => map.set(slugOf(e), i + 1));
  return map;
};

/**
 * The homepage "Selected case files" section — plan/02 §2.4 `featured` flag.
 * Wrapped in forSurface('home') so drafts, unlisted and hideFrom:['home'] never
 * leak in. If nothing is featured the caller renders no section at all.
 */
export const featuredOnHome = (
  entries: Writeup[],
  lang: Writeup['data']['lang']
): Writeup[] =>
  forSurface(entries, 'home', lang)
    .filter((e) => e.data.visibility.featured)
    .slice(0, 3);
