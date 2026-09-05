import type { CollectionEntry } from 'astro:content';
import type { UIKey } from '../i18n/ui';

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
export type Project = CollectionEntry<'projects'>;
export type Note = CollectionEntry<'notes'>;

/** Locale code shared by every localized collection (plan/02 §2.7). */
export type Lang = Writeup['data']['lang'];

/**
 * A surface is a place a post can appear. `direct` is the viewing context of
 * the post's own page (a direct link), which bypasses `unlisted`.
 */
export type Surface = 'home' | 'archive' | 'rss' | 'search' | 'sitemap' | 'related' | 'direct';

type VisibilityCarrier = { data: { visibility: { draft: boolean } } };

export const isPublic = (entry: VisibilityCarrier): boolean => !entry.data.visibility.draft;

/** Drafts are not built into the production output at all (plan/02 §2.4). */
export const buildsInProd = (entry: VisibilityCarrier): boolean =>
  !(import.meta.env.PROD && entry.data.visibility.draft);

/**
 * The entry shape `forSurface()` needs. Writeups, projects and notes all
 * satisfy it, so one filter serves every collection (rule 7) — a second,
 * per-collection copy of this logic is how a draft leaks into RSS.
 */
interface SurfaceEntry {
  data: {
    lang: Lang;
    visibility: { draft: boolean; unlisted: boolean; hideFrom: string[] };
    publishedAt: Date;
  };
}

export const forSurface = <T extends SurfaceEntry>(
  entries: T[],
  surface: Surface,
  lang: Lang
): T[] =>
  entries
    .filter(isPublic)
    .filter((e) => e.data.lang === lang)
    .filter((e) => !e.data.visibility.unlisted || surface === 'direct')
    .filter((e) => surface === 'direct' || !e.data.visibility.hideFrom.includes(surface))
    .sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());

/**
 * Locale-independent slug derived from the on-disk id (`en/foo.mdx` → `foo`).
 * Structural on purpose: every collection that follows the one-folder-per-
 * language convention (plan/02 §2.3) produces ids this helper understands.
 */
export const slugOf = (entry: { id: string }): string =>
  entry.id.replace(/\.mdx?$/, '').replace(/^[a-z]{2}\//, '');

/**
 * The counterpart post in the other language. Generic over every collection
 * that follows the same-slug convention (plan/02 §2.2), falling back to the
 * explicit `translationOf` field.
 */
export const getTranslation = <
  T extends { id: string; data: { lang: Lang; translationOf?: string } },
>(
  entries: T[],
  entry: T
): T | undefined => {
  const other: Lang = entry.data.lang === 'en' ? 'ar' : 'en';
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
export const featuredOnHome = (entries: Writeup[], lang: Writeup['data']['lang']): Writeup[] =>
  forSurface(entries, 'home', lang)
    .filter((e) => e.data.visibility.featured)
    .slice(0, 3);

/**
 * Projects follow the same visibility rules as writeups (plan/02 §2.4).
 * `surface === 'direct'` bypasses `unlisted`; anything else is a listing
 * surface. Projects never enter RSS, so `rss`/`home`/`search` are handled by
 * the same hideFrom enum.
 */
export const projectSurface = (entries: Project[], lang: Project['data']['lang']): Project[] =>
  entries
    .filter((e) => !e.data.visibility.draft)
    .filter((e) => e.data.lang === lang)
    .filter((e) => !e.data.visibility.unlisted)
    .filter((e) => !e.data.visibility.hideFrom.includes('archive'))
    .sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());

/** Same on-disk slug convention as writeups: `en/gymos.mdx` → `gymos`. */
export const projectSlugOf = (entry: Project): string => slugOf(entry);

/** The counterpart project in the other language (same slug by convention). */
export const getProjectTranslation = (entries: Project[], entry: Project): Project | undefined => {
  const other: Project['data']['lang'] = entry.data.lang === 'en' ? 'ar' : 'en';
  const sameSlug = entries.find(
    (e) => e.data.lang === other && projectSlugOf(e) === projectSlugOf(entry)
  );
  if (sameSlug) return sameSlug;
  if (entry.data.translationOf) {
    return entries.find(
      (e) => e.data.lang === other && projectSlugOf(e) === entry.data.translationOf
    );
  }
  return undefined;
};

/**
 * Resolve a project's `relatedWriteups` slugs to entries that actually exist
 * and build in production, preferring the current locale and falling back to
 * the English version. Used to build internal links that never 404.
 */
export const relatedWriteupEntries = (
  entries: Writeup[],
  slugs: string[],
  lang: Writeup['data']['lang']
): Writeup[] =>
  slugs
    .map((slug) => {
      const local = entries.find((e) => e.data.lang === lang && slugOf(e) === slug);
      return local ?? entries.find((e) => e.data.lang === 'en' && slugOf(e) === slug);
    })
    .filter((e): e is Writeup => Boolean(e && buildsInProd(e)));

/* ────────────────────────────────────────────────────────────────────────────
 * Pre-rendered archive facets — plan/04-features.md F-03 (2026-09 correction).
 *
 * Filtering is single-dimension with one built path per value
 * (`/writeups/<kind>/<slug>`, `/ar/writeups/<kind>/<slug>`). Query params
 * cannot work on `output: 'static'` — `Astro.url` carries no search string at
 * build time, so any page reading it is dead code (the exact defect this
 * design replaced). Everything below is pure: pages pass entries that already
 * survived `forSurface()` and never filter on their own.
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * A facet value only gets a route (and a link) when at least this many archive
 * entries match it. A value below the threshold renders as plain text, never
 * as an `<a>` and never with a dead href — thin one-entry archive pages are
 * deliberately not generated. Every threshold check reads THIS constant.
 */
export const FACET_MIN_ENTRIES = 2;

export type FacetKind = 'category' | 'type' | 'cwe' | 'year' | 'severity' | 'series';

/** Display order of the filter groups in the archive filter bar. */
export const FACET_KINDS: readonly FacetKind[] = [
  'category',
  'type',
  'cwe',
  'year',
  'severity',
  'series',
];

/** i18n key naming each facet group — labels never live in components. */
export const facetLabelKey: Record<FacetKind, UIKey> = {
  category: 'filter.category',
  type: 'filter.type',
  cwe: 'filter.cwe',
  year: 'filter.year',
  severity: 'filter.severity',
  series: 'filter.series',
};

/** URL segment for a facet value: `CWE-639` → `cwe-639`, `CAT Reloaded` → `cat-reloaded`. */
export const facetSlug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Locale-independent path of a facet page (`/writeups/<kind>/<slug>`). Pages
 * wrap it in `getRelativeLocaleUrl()` — the only sanctioned way to link.
 */
export const facetPath = (kind: FacetKind, slug: string): string => `/writeups/${kind}/${slug}`;

/** Publication year in Western digits — years are technical, never localized. */
export const yearOf = (entry: Writeup): string => String(entry.data.publishedAt.getUTCFullYear());

/** The facet values a single entry contributes for `kind` (a writeup can carry several CWE ids). */
export const facetValuesOf = (entry: Writeup, kind: FacetKind): string[] => {
  switch (kind) {
    case 'category':
      return [entry.data.category];
    case 'type':
      return [entry.data.targetType];
    case 'cwe':
      return [...entry.data.cwe];
    case 'year':
      return [yearOf(entry)];
    case 'severity':
      return entry.data.severity ? [entry.data.severity] : [];
    case 'series':
      return entry.data.series ? [entry.data.series] : [];
  }
};

export interface FacetGroup {
  /** Value as stored in frontmatter — ids stay ids, they are never translated. */
  value: string;
  /** URL segment (`facetSlug(value)`). */
  slug: string;
  /** Matching entries, newest first (the `forSurface()` order is preserved). */
  entries: Writeup[];
  /** True when a route was generated for this value (`entries.length >= FACET_MIN_ENTRIES`). */
  linkable: boolean;
}

/**
 * Group archive-surfaced entries by facet value. Groups below
 * `FACET_MIN_ENTRIES` are still returned — the filter bar shows them as plain
 * text — but carry `linkable: false` so no route and no link ever point at
 * them. Years sort newest first; everything else by count then name.
 */
export const facetGroups = (entries: Writeup[], kind: FacetKind): FacetGroup[] => {
  const bySlug = new Map<string, FacetGroup>();
  for (const e of entries) {
    for (const value of facetValuesOf(e, kind)) {
      const slug = facetSlug(value);
      const existing = bySlug.get(slug);
      if (existing) {
        existing.entries.push(e);
      } else {
        bySlug.set(slug, { value, slug, entries: [e], linkable: false });
      }
    }
  }
  const groups = [...bySlug.values()];
  for (const g of groups) g.linkable = g.entries.length >= FACET_MIN_ENTRIES;
  return groups.sort((a, b) =>
    kind === 'year'
      ? Number(b.value) - Number(a.value)
      : b.entries.length - a.entries.length ||
        a.value.localeCompare(b.value, 'en', { numeric: true })
  );
};

/** Linkable values per kind — the lookup cards and headers use to decide link vs text. */
export type FacetIndex = Record<FacetKind, Set<string>>;

/** Build the linkable-value lookup for one locale's archive-surfaced entries. */
export const facetIndex = (archive: Writeup[]): FacetIndex => {
  const index = {
    category: new Set<string>(),
    type: new Set<string>(),
    cwe: new Set<string>(),
    year: new Set<string>(),
    severity: new Set<string>(),
    series: new Set<string>(),
  } as FacetIndex;
  for (const kind of FACET_KINDS) {
    for (const g of facetGroups(archive, kind)) {
      if (g.linkable) index[kind].add(g.value);
    }
  }
  return index;
};

/**
 * Reading order inside one series: `seriesOrder` ascending when present,
 * `publishedAt` ascending otherwise; entries without an explicit order sort
 * after the ordered ones (plan/04 F-02 series strip).
 */
export const seriesOrdered = (members: Writeup[]): Writeup[] =>
  [...members].sort((a, b) => {
    const oa = a.data.seriesOrder ?? Number.POSITIVE_INFINITY;
    const ob = b.data.seriesOrder ?? Number.POSITIVE_INFINITY;
    if (oa !== ob) return oa - ob;
    return a.data.publishedAt.getTime() - b.data.publishedAt.getTime();
  });

export interface SeriesPart {
  position: number;
  total: number;
}

/** `slug → position/total` for every series member in one locale's archive surface. */
export const seriesParts = (archive: Writeup[]): Map<string, SeriesPart> => {
  const byName = new Map<string, Writeup[]>();
  for (const e of archive) {
    const name = e.data.series;
    if (!name) continue;
    byName.set(name, [...(byName.get(name) ?? []), e]);
  }
  const parts = new Map<string, SeriesPart>();
  for (const members of byName.values()) {
    const ordered = seriesOrdered(members);
    ordered.forEach((e, i) => parts.set(slugOf(e), { position: i + 1, total: ordered.length }));
  }
  return parts;
};

/**
 * Related writeups ranked by shared CWE ids first, then shared OWASP ids,
 * then same category — never by tags (plan/04 F-02). Ties break by newest
 * `publishedAt`. A candidate sharing nothing is dropped, so an entry with no
 * overlap yields an empty list and the caller renders no section at all.
 */
export const relatedByCwe = (
  entries: Writeup[],
  entry: Writeup,
  lang: Writeup['data']['lang'],
  limit = 3
): Writeup[] => {
  const shared = (a: string[], b: string[]): number => a.filter((x) => b.includes(x)).length;
  return forSurface(entries, 'related', lang)
    .filter((e) => slugOf(e) !== slugOf(entry))
    .map((e) => ({
      e,
      cwe: shared(e.data.cwe, entry.data.cwe),
      owasp: shared(e.data.owasp, entry.data.owasp),
      cat: e.data.category === entry.data.category ? 1 : 0,
    }))
    .filter((s) => s.cwe > 0 || s.owasp > 0 || s.cat > 0)
    .sort(
      (a, b) =>
        b.cwe - a.cwe ||
        b.owasp - a.owasp ||
        b.cat - a.cat ||
        b.e.data.publishedAt.getTime() - a.e.data.publishedAt.getTime()
    )
    .slice(0, limit)
    .map((s) => s.e);
};

/* ────────────────────────────────────────────────────────────────────────────
 * Notes stream kind facets — plan/04-features.md F-06.
 *
 * The stream has exactly one facet dimension (`kind`), served by the same
 * pre-rendered-route + threshold rules as the writeup archive (F-03): one
 * built path per kind with at least FACET_MIN_ENTRIES stream entries, plain
 * text below it, noindex and outside the sitemap everywhere.
 * ──────────────────────────────────────────────────────────────────────────── */

/** The four §2.4 note kinds — the binding schema, not F-06's loose prose. */
export type NoteKind = 'note' | 'book-summary' | 'paper-summary' | 'til';

/** Canonical fallback display order (schema enum order); count sorts first. */
export const NOTE_KINDS: readonly NoteKind[] = ['note', 'book-summary', 'paper-summary', 'til'];

/** i18n key naming each kind — labels never live in components. */
export const noteKindLabelKey: Record<NoteKind, UIKey> = {
  note: 'note.kind.note',
  'book-summary': 'note.kind.book-summary',
  'paper-summary': 'note.kind.paper-summary',
  til: 'note.kind.til',
};

export interface NoteKindGroup {
  kind: NoteKind;
  /** URL segment — `facetSlug(kind)`, which is the kind itself. */
  slug: string;
  /** Matching notes, newest first (the `forSurface()` order is preserved). */
  entries: Note[];
  /** True when a route was generated (`entries.length >= FACET_MIN_ENTRIES`). */
  linkable: boolean;
}

/**
 * Group stream-surfaced notes by kind. Groups below `FACET_MIN_ENTRIES` are
 * still returned — the kind bar shows them as plain text — but carry
 * `linkable: false` so no route and no link ever point at them. Sorted by
 * count, then by the canonical schema order.
 */
export const noteKindGroups = (entries: Note[]): NoteKindGroup[] => {
  const byKind = new Map<NoteKind, Note[]>();
  for (const e of entries) {
    byKind.set(e.data.kind, [...(byKind.get(e.data.kind) ?? []), e]);
  }
  const canonical = new Map(NOTE_KINDS.map((k, i) => [k, i] as const));
  return [...byKind.entries()]
    .map(([kind, list]) => ({
      kind,
      slug: facetSlug(kind),
      entries: list,
      linkable: list.length >= FACET_MIN_ENTRIES,
    }))
    .sort(
      (a, b) =>
        b.entries.length - a.entries.length || canonical.get(a.kind)! - canonical.get(b.kind)!
    );
};

/** Linkable kinds for one locale's stream — the lookup cards use to decide link vs text. */
export const noteKindIndex = (stream: Note[]): Set<string> =>
  new Set(
    noteKindGroups(stream)
      .filter((g) => g.linkable)
      .map((g) => g.kind)
  );

/** Locale-independent path of a kind facet page (`/notes/kind/<kind>`). */
export const noteKindPath = (kind: NoteKind): string => `/notes/kind/${facetSlug(kind)}`;

/**
 * Topics the site can actually show it works on — plan/07 §7.2 `knowsAbout`.
 *
 * Derived, never asserted: the CWE ids of writeups that build in production
 * plus the arsenal's capability domains in the requested locale. It grows with
 * the content, so it can never overstate what is on the site — which is the
 * same rule the proof layer applies to every other claim (plan/04 F-11).
 * `alumniOf`, also listed in §7.2, is owner biography and is not derivable, so
 * it is deliberately not emitted.
 */
export const documentedTopics = (
  writeups: Writeup[],
  arsenalDomains: string[],
  lang: Writeup['data']['lang']
): string[] => {
  const topics = new Set<string>();
  for (const e of forSurface(writeups, 'archive', lang)) {
    for (const id of e.data.cwe) topics.add(id);
  }
  for (const d of arsenalDomains) if (d.trim()) topics.add(d.trim());
  return [...topics].sort();
};
