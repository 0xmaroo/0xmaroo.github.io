import { describe, expect, it } from 'vitest';
import {
  caseNumbers,
  featuredOnHome,
  forSurface,
  forSurfaceWithFallback,
  livePaths,
  slugOf,
} from '../src/lib/content';
import { writeup } from './fixtures';

const ids = (list: { id: string }[]) => list.map((e) => e.id);

describe('forSurface — the one visibility gate (CLAUDE.md rule 7)', () => {
  const entries = [
    writeup({ id: 'en/public.mdx', publishedAt: '2026-01-01' }),
    writeup({ id: 'en/newer.mdx', publishedAt: '2026-03-01' }),
    writeup({ id: 'en/draft.mdx', draft: true }),
    writeup({ id: 'en/unlisted.mdx', unlisted: true }),
    writeup({ id: 'en/no-rss.mdx', hideFrom: ['rss'] }),
    writeup({ id: 'ar/arabic.mdx', lang: 'ar' }),
  ];

  it('never lets a draft through, on any surface', () => {
    for (const surface of [
      'home',
      'archive',
      'rss',
      'search',
      'sitemap',
      'related',
      'direct',
    ] as const) {
      expect(ids(forSurface(entries, surface, 'en'))).not.toContain('en/draft.mdx');
    }
  });

  it('keeps unlisted posts off every surface except their own page', () => {
    expect(ids(forSurface(entries, 'archive', 'en'))).not.toContain('en/unlisted.mdx');
    expect(ids(forSurface(entries, 'rss', 'en'))).not.toContain('en/unlisted.mdx');
    expect(ids(forSurface(entries, 'direct', 'en'))).toContain('en/unlisted.mdx');
  });

  it('honours hideFrom per surface only', () => {
    expect(ids(forSurface(entries, 'rss', 'en'))).not.toContain('en/no-rss.mdx');
    expect(ids(forSurface(entries, 'archive', 'en'))).toContain('en/no-rss.mdx');
  });

  it('filters by language and sorts newest first', () => {
    const list = ids(forSurface(entries, 'archive', 'en'));
    expect(list).not.toContain('ar/arabic.mdx');
    expect(list[0]).toBe('en/newer.mdx');
  });
});

describe('forSurfaceWithFallback — plan/01 §1.4', () => {
  it('lists an English-only post on the Arabic side', () => {
    const entries = [writeup({ id: 'en/only-en.mdx' })];
    expect(ids(forSurfaceWithFallback(entries, 'archive', 'ar'))).toEqual(['en/only-en.mdx']);
  });

  it('does not duplicate a post that exists in both languages', () => {
    const entries = [writeup({ id: 'en/both.mdx' }), writeup({ id: 'ar/both.mdx', lang: 'ar' })];
    expect(ids(forSurfaceWithFallback(entries, 'archive', 'ar'))).toEqual(['ar/both.mdx']);
  });

  it('still refuses drafts and unlisted posts from the other language', () => {
    const entries = [
      writeup({ id: 'en/draft.mdx', draft: true }),
      writeup({ id: 'en/unlisted.mdx', unlisted: true }),
    ];
    expect(forSurfaceWithFallback(entries, 'archive', 'ar')).toEqual([]);
  });

  it('feeds the home page through the same fallback', () => {
    const entries = [writeup({ id: 'en/featured.mdx', featured: true })];
    expect(ids(featuredOnHome(entries, 'ar'))).toEqual(['en/featured.mdx']);
  });
});

describe('caseNumbers', () => {
  it('does not count drafts — the first published case is CASE 001', () => {
    const entries = [
      writeup({ id: 'en/old-draft.mdx', draft: true, publishedAt: '2025-01-01' }),
      writeup({ id: 'en/first.mdx', publishedAt: '2026-09-26' }),
    ];
    expect(caseNumbers(entries).get('first')).toBe(1);
    expect(caseNumbers(entries).has('old-draft')).toBe(false);
  });

  it('gives both language versions of a post the same number', () => {
    const entries = [
      writeup({ id: 'en/a.mdx', publishedAt: '2026-01-01' }),
      writeup({ id: 'ar/a.mdx', lang: 'ar', publishedAt: '2026-02-01' }),
      writeup({ id: 'en/b.mdx', publishedAt: '2026-03-01' }),
    ];
    const numbers = caseNumbers(entries);
    expect(numbers.get('a')).toBe(1);
    expect(numbers.get('b')).toBe(2);
    expect(numbers.size).toBe(2);
  });
});

describe('livePaths', () => {
  it('contains only pages that exist in that language', () => {
    const entries = [writeup({ id: 'en/live.mdx' }), writeup({ id: 'en/draft.mdx', draft: true })];
    const en = livePaths(entries, [], 'en');
    expect(en.has('/writeups/live')).toBe(true);
    expect(en.has('/writeups/draft')).toBe(false);
    expect(livePaths(entries, [], 'ar').size).toBe(0);
  });
});

describe('slugOf', () => {
  it('strips the language folder and extension', () => {
    expect(slugOf({ id: 'ar/some-post.mdx' })).toBe('some-post');
    expect(slugOf({ id: 'en/x.md' })).toBe('x');
  });
});
