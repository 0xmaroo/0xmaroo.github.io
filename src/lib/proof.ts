import { getCollection, type CollectionEntry } from 'astro:content';
import { FACET_MIN_ENTRIES, facetSlug } from './content';

/**
 * Proof layer — plan/04-features.md F-11.
 *
 * Every claim on the site (a rank, a metric, a certificate) must link a real
 * URL before it is rendered. A data entry may exist without one; the surface
 * filters below hold it back and hand it to the caller so it can be listed,
 * instead of silently shipping an unverifiable number.
 *
 * "Real" means an http(s) URL. Internal links and `TODO(proof)` markers are
 * deliberately NOT proof — internal cross-links are safe to render elsewhere
 * (e.g. arsenal `usedOn`), but they never satisfy a claim's verification.
 */

export const isRealProof = (url: string): boolean =>
  url.startsWith('https://') || url.startsWith('http://');

/** A placeholder that must never be displayed as content. */
export const isTodo = (value: string): boolean => value === '' || value === 'TODO(copy)';

export interface Suppressed {
  id: string;
  claim: string;
}

export interface ProofFilterResult<T> {
  shown: T[];
  suppressed: Suppressed[];
}

/**
 * Split a list into rows that can render and rows held back for a missing
 * proof. `claimOf` returns '' for narrative-only entries, which render without
 * proof.
 */
export function gateOnProof<T>(
  entries: T[],
  claimOf: (e: T) => string,
  proofOf: (e: T) => string
): ProofFilterResult<T> {
  const shown: T[] = [];
  const suppressed: Suppressed[] = [];
  for (const e of entries) {
    const claim = claimOf(e);
    if (claim !== '' && !isRealProof(proofOf(e))) {
      suppressed.push({ id: (e as { id: string }).id, claim });
      continue;
    }
    shown.push(e);
  }
  return { shown, suppressed };
}

export type Lab = CollectionEntry<'labs'>;
export type Journey = CollectionEntry<'journey'>;
export type Arsenal = CollectionEntry<'arsenal'>;

/**
 * Labs/CTF rows: F-05 — a row without a real `proof` URL is never placed,
 * with or without a `result`. Participation itself is the claim.
 */
export const surfaceLabs = (entries: Lab[]): ProofFilterResult<Lab> =>
  gateOnProof(
    entries,
    () => 'participation',
    (e) => e.data.proof
  );

export interface LabPlatform {
  /** Platform name as stored in the YAML (`TryHackMe`, `CAT Reloaded`, …). */
  platform: string;
  /** URL segment (`facetSlug(platform)`). */
  slug: string;
  /** Surfaced labs on this platform. */
  labs: Lab[];
  /** True when a `/labs/platform/<slug>` route exists (`labs.length >= FACET_MIN_ENTRIES`). */
  linkable: boolean;
}

/**
 * Platform chips for the labs pages, derived ONLY from labs `surfaceLabs()`
 * actually surfaces (a suppressed lab must not advertise a platform), with the
 * same generation threshold as writeup facets — below it the platform renders
 * as plain text, never as a link (plan/04 F-03 + F-05).
 */
export const labPlatforms = (shown: Lab[]): LabPlatform[] => {
  const bySlug = new Map<string, LabPlatform>();
  for (const lab of shown) {
    const slug = facetSlug(lab.data.platform);
    const existing = bySlug.get(slug);
    if (existing) {
      existing.labs.push(lab);
    } else {
      bySlug.set(slug, { platform: lab.data.platform, slug, labs: [lab], linkable: false });
    }
  }
  const platforms = [...bySlug.values()];
  for (const p of platforms) p.linkable = p.labs.length >= FACET_MIN_ENTRIES;
  return platforms.sort((a, b) => a.platform.localeCompare(b.platform, 'en'));
};

/** A string still carrying a placeholder marker anywhere (`TODO(copy): …`). */
const hasPlaceholder = (value: string): boolean => value.includes('TODO(');

/**
 * Journey stations: only claim-bearing stations need a proof — and a station
 * whose event text is still a placeholder is held back too, so the timeline
 * never shows `TODO(copy)` to a visitor.
 */
export const surfaceJourney = (entries: Journey[]): ProofFilterResult<Journey> => {
  const { shown, suppressed } = gateOnProof(
    entries,
    (e) => e.data.claim,
    (e) => e.data.proof
  );
  const written = shown.filter((e) => !hasPlaceholder(e.data.event.en + e.data.event.ar));
  for (const e of shown) {
    if (!written.includes(e)) suppressed.push({ id: e.id, claim: 'TODO(copy) event' });
  }
  return { shown: written, suppressed };
};

/** Surfaced journey stations in display order: dated (oldest first), then undated. */
export async function journeyTimeline(): Promise<Journey[]> {
  const { shown, suppressed } = surfaceJourney(await getCollection('journey'));
  for (const s of suppressed) {
    console.warn(`[proof] journey "${s.id}" held back — ${s.claim}.`);
  }
  const dated = shown
    .filter((s) => s.data.date)
    .sort((a, b) => a.data.date!.getTime() - b.data.date!.getTime());
  return [...dated, ...shown.filter((s) => !s.data.date)];
}

/** Project metrics: every figure with a value needs its own real proof URL. */
export const surfaceProjectMetrics = (
  metrics: CollectionEntry<'projects'>['data']['metrics']
): { shown: CollectionEntry<'projects'>['data']['metrics']; suppressed: Suppressed[] } => {
  const shown = metrics.filter((m) => isRealProof(m.proof));
  const suppressed = metrics
    .filter((m) => !isRealProof(m.proof))
    .map((m) => ({ id: m.value, claim: m.label }));
  return { shown, suppressed };
};
