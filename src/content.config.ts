import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Visibility controls — plan/02-architecture.md §2.4 verbatim.
 * One line in frontmatter changes a post's presence everywhere, because every
 * surface reads through `forSurface()` in src/lib/content.ts.
 *
 * `draft` and `hideFrom` are the leak-proofing pair:
 *  - `draft`    → not built into the production output at all (getStaticPaths)
 *  - `hideFrom` → fine-grained surface control without losing the direct URL
 */
export const visibility = z.object({
  draft: z.boolean().default(true), // won't build at all in production
  unlisted: z.boolean().default(false), // has a link, but no archive/RSS/sitemap presence
  featured: z.boolean().default(false), // shows on the homepage
  noindex: z.boolean().default(false), // meta robots noindex
  hideFrom: z
    .array(z.enum(['home', 'archive', 'rss', 'search', 'sitemap', 'related']))
    .default([]), // precise: where it appears and where it doesn't
});

const writeups = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/writeups' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().max(70),
      summary: z.string().min(80).max(200), // used in meta and on the card
      lang: z.enum(['en', 'ar']),
      translationOf: z.string().optional(), // slug of the other-language version
      publishedAt: z.coerce.date(),
      updatedAt: z.coerce.date().optional(),

      // Classification
      category: z.enum(['web', 'network', 'forensics', 'reversing', 'cloud', 'mobile', 'misc']),
      tags: z.array(z.string()).max(8),
      series: z.string().optional(), // links a series of posts
      seriesOrder: z.number().optional(),

      // The fields that make this site different from any other blog
      target: z.string(), // "GymOS v1.2 — self-built" / "HTB: Cascade"
      targetType: z.enum(['own-system', 'ctf', 'lab', 'public-program', 'research']),
      cwe: z.array(z.string()).default([]), // ['CWE-639','CWE-284']
      owasp: z.array(z.string()).default([]), // ['A01:2021']
      severity: z.enum(['info', 'low', 'medium', 'high', 'critical']).optional(),
      status: z.enum(['patched', 'disclosed', 'lab-only', 'wip']),
      hasFix: z.boolean().default(false), // does it contain a real code-level fix?
      toolsUsed: z.array(z.string()).default([]),
      readingTime: z.number().optional(), // computed automatically

      cover: image().optional(),
      visibility: visibility.default(() => ({
        draft: true,
        unlisted: false,
        featured: false,
        noindex: false,
        hideFrom: [],
      })),
    }),
});

export const collections = { writeups };
