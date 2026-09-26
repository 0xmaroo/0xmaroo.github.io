import type { Writeup } from '../src/lib/content';

type Overrides = {
  id: string;
  lang?: 'en' | 'ar';
  publishedAt?: string;
  draft?: boolean;
  unlisted?: boolean;
  featured?: boolean;
  hideFrom?: string[];
};

/** A minimal writeup entry — only the fields src/lib reads. */
export const writeup = (o: Overrides): Writeup =>
  ({
    id: o.id,
    data: {
      lang: o.lang ?? 'en',
      publishedAt: new Date(o.publishedAt ?? '2026-01-01'),
      visibility: {
        draft: o.draft ?? false,
        unlisted: o.unlisted ?? false,
        featured: o.featured ?? false,
        noindex: false,
        hideFrom: o.hideFrom ?? [],
      },
    },
  }) as unknown as Writeup;
