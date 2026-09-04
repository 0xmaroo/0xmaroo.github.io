import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Language } from '../i18n/ui';
import { buildsInProd, forSurface, projectSlugOf, projectSurface, slugOf } from './content';

/**
 * URLs of built writeup/project pages that must stay out of the sitemap
 * (plan/02 §2.4: unlisted → no sitemap). @astrojs/sitemap's `filter` is
 * synchronous and runs in the config process, while getStaticPaths runs in the
 * page-build process — module state is NOT shared between the two. So the
 * exclusion set is handed over through a cache file in `.astro/`, written
 * during page rendering (which runs before the sitemap integration's
 * `astro:build:done` hook).
 */

const cachePath = () => join(process.cwd(), '.astro', 'sitemap-excluded.json');

async function writeupExclusions(lang: Language): Promise<string[]> {
  const { getCollection } = await import('astro:content');
  const entries = await getCollection('writeups');
  const surfaced = new Set(forSurface(entries, 'sitemap', lang).map((e) => slugOf(e)));
  const excluded: string[] = [];
  for (const e of entries.filter((x) => x.data.lang === lang)) {
    if (!buildsInProd(e)) continue; // never built → never in sitemap
    const slug = slugOf(e);
    if (e.data.visibility.noindex || !surfaced.has(slug)) {
      const prefix = lang === 'en' ? '/writeups/' : '/ar/writeups/';
      excluded.push(`${prefix}${slug}`);
    }
  }
  return excluded;
}

async function projectExclusions(lang: Language): Promise<string[]> {
  const { getCollection } = await import('astro:content');
  const entries = await getCollection('projects');
  // projectSurface is the list surface (drafts + unlisted removed); the
  // sitemap mirrors it, so anything not on it — plus noindex — is excluded.
  const surfaced = new Set(projectSurface(entries, lang).map((e) => projectSlugOf(e)));
  const excluded: string[] = [];
  for (const e of entries.filter((x) => x.data.lang === lang)) {
    if (!buildsInProd(e)) continue;
    const slug = projectSlugOf(e);
    if (e.data.visibility.noindex || !surfaced.has(slug)) {
      const prefix = lang === 'en' ? '/projects/' : '/ar/projects/';
      excluded.push(`${prefix}${slug}`);
    }
  }
  return excluded;
}

export async function registerSitemapExclusions(): Promise<void> {
  const excluded = new Set<string>();
  for (const lang of ['en', 'ar'] as Language[]) {
    for (const item of await writeupExclusions(lang)) excluded.add(item);
    for (const item of await projectExclusions(lang)) excluded.add(item);
  }
  writeFileSync(cachePath(), JSON.stringify([...excluded]), 'utf8');
}

/** Static noindex routes that must never be listed (plan/08 §8.6). */
const staticExcluded = new Set(['/404', '/ar/404']);

/** Sync check used by the sitemap `filter` at astro:build:done. */
export function isSitemapExcluded(url: string): boolean {
  const pathname = new URL(url).pathname.replace(/\/$/, '');
  if (staticExcluded.has(pathname)) return true;
  const file = cachePath();
  if (!existsSync(file)) return false;
  const excluded = new Set<string>(JSON.parse(readFileSync(file, 'utf8')) as string[]);
  return excluded.has(pathname);
}
