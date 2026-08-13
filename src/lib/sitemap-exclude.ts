import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Language } from '../i18n/ui';
import { buildsInProd, forSurface, slugOf } from './content';

/**
 * URLs of built writeup pages that must stay out of the sitemap (plan/02 §2.4:
 * unlisted → no sitemap). @astrojs/sitemap's `filter` is synchronous and runs
 * in the config process, while getStaticPaths runs in the page-build process —
 * module state is NOT shared between the two. So the exclusion set is handed
 * over through a cache file in `.astro/`, written during page rendering
 * (which runs before the sitemap integration's `astro:build:done` hook).
 */

const cachePath = () => join(process.cwd(), '.astro', 'sitemap-excluded.json');

export async function registerSitemapExclusions(): Promise<void> {
  const { getCollection } = await import('astro:content');
  const entries = await getCollection('writeups');
  const excluded = new Set<string>();

  for (const lang of ['en', 'ar'] as Language[]) {
    const surfaced = new Set(forSurface(entries, 'sitemap', lang).map((e) => slugOf(e)));
    for (const e of entries.filter((x) => x.data.lang === lang)) {
      if (!buildsInProd(e)) continue; // never built → never in sitemap
      const slug = slugOf(e);
      if (e.data.visibility.noindex || !surfaced.has(slug)) {
        const prefix = lang === 'en' ? '/writeups/' : '/ar/writeups/';
        excluded.add(`${prefix}${slug}`);
      }
    }
  }

  writeFileSync(cachePath(), JSON.stringify([...excluded]), 'utf8');
}

/** Sync check used by the sitemap `filter` at astro:build:done. */
export function isSitemapExcluded(url: string): boolean {
  const file = cachePath();
  if (!existsSync(file)) return false;
  const excluded = new Set<string>(JSON.parse(readFileSync(file, 'utf8')) as string[]);
  return excluded.has(new URL(url).pathname.replace(/\/$/, ''));
}
