import { getCollection } from 'astro:content';
import type { Language, UIKey } from '../i18n/ui';
import { ui } from '../i18n/ui';
import { renderEntryOgImage } from './og';
import {
  buildsInProd,
  caseNumbers,
  projectSlugOf,
  slugOf,
  type Project,
  type Writeup,
} from './content';

/**
 * Per-entry OG images — plan/05 Phase 3. Lives in the page-build process
 * (unlike the config-process default images): static endpoints under
 * `src/pages/og/` and `src/pages/ar/og/` call these helpers from
 * `getStaticPaths()`/`GET`, so `getCollection` works and the PNGs emit
 * straight into `dist/` without ever touching `public/` (a source dir).
 *
 * Path lists only contain entries that build in production (`buildsInProd`)
 * and eyebrow/meta strings are composed from `src/i18n/ui.ts` plus entry
 * data — the case number comes from the same `caseNumbers()` map the cards
 * use, never a second numbering.
 */

const pngResponse = (png: Buffer): Response =>
  new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });

export async function writeupOgPaths(lang: Language) {
  const entries = await getCollection('writeups');
  return entries
    .filter((e) => e.data.lang === lang && buildsInProd(e))
    .map((entry) => ({ params: { slug: slugOf(entry) }, props: { entry } }));
}

export async function writeupOgResponse(entry: Writeup): Promise<Response> {
  const t = ui[entry.data.lang];
  // Same composition as WriteupCard's case id: 'CASE 001 · WEB'.
  const caseNo = caseNumbers(await getCollection('writeups')).get(slugOf(entry)) ?? 0;
  const eyebrow = `${t['case.id']} ${String(caseNo).padStart(3, '0')} · ${entry.data.category.toUpperCase()}`;
  return pngResponse(
    await renderEntryOgImage({
      lang: entry.data.lang,
      title: entry.data.title,
      eyebrow,
      meta:
        entry.data.cwe.length > 0
          ? { text: entry.data.cwe.join(', '), technical: true }
          : undefined,
    })
  );
}

export async function projectOgPaths(lang: Language) {
  const entries = await getCollection('projects');
  return entries
    .filter((e) => e.data.lang === lang && buildsInProd(e))
    .map((entry) => ({ params: { slug: projectSlugOf(entry) }, props: { entry } }));
}

export async function projectOgResponse(entry: Project): Promise<Response> {
  const t = ui[entry.data.lang];
  // Same composition as the project page eyebrow: '§03 · gymos', plus the
  // localized status stamp as the meta line (projects carry no CWE).
  const eyebrow = `${t['projects.eyebrow']} · ${projectSlugOf(entry)}`;
  return pngResponse(
    await renderEntryOgImage({
      lang: entry.data.lang,
      title: entry.data.title,
      eyebrow,
      meta: { text: t[`status.${entry.data.status}` as UIKey], technical: false },
    })
  );
}
