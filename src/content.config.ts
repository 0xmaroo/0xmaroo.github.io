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
  hideFrom: z.array(z.enum(['home', 'archive', 'rss', 'search', 'sitemap', 'related'])).default([]), // precise: where it appears and where it doesn't
});

/**
 * Localized string pair. Bilingual content is mandatory for projects
 * (plan/01 §1.4); journey stations are structured for both locales from day
 * one even while the copy is still `TODO(copy)`.
 */
export const l10nText = z.object({
  en: z.string(),
  ar: z.string(),
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

/**
 * Projects — bilingual-mandatory case studies (plan/01 §1.4, plan/02 §2.4).
 * Every verifiable figure lives in `metrics` and needs its own `proof` URL;
 * the Project layout only renders metrics that carry one (plan/04 F-11).
 * `role` is required by the schema; until the owner writes it the value stays
 * `TODO(copy)` and the layout does not display it.
 */
const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: () =>
    z.object({
      title: z.string().max(80),
      summary: z.string().min(1).max(220), // TODO(copy) until the owner writes it
      lang: z.enum(['en', 'ar']),
      translationOf: z.string().optional(),
      publishedAt: z.coerce.date(),
      updatedAt: z.coerce.date().optional(),
      role: z.string().min(1), // mandatory; 'TODO(copy)' until written
      status: z.enum(['live', 'archived', 'private']),
      stack: z.array(z.string()).default([]),
      metrics: z
        .array(
          z.object({
            value: z.string(),
            label: z.string(),
            proof: z.string().default(''), // verification URL; no URL → not rendered
          })
        )
        .default([]),
      repo: z.string().default(''),
      demo: z.string().default(''),
      securityNotes: z.string().default(''),
      relatedWriteups: z.array(z.string()).default([]),
      visibility: visibility.default(() => ({
        draft: true,
        unlisted: false,
        featured: false,
        noindex: false,
        hideFrom: [],
      })),
    }),
});

/**
 * Labs & CTF — one YAML file per result (plan/02 §2.3, plan/04 F-05).
 * A row with a claim (`result`) but no real `proof` URL is held back by the
 * surface filter — never rendered.
 */
const labs = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/labs' }),
  schema: () =>
    z.object({
      platform: z.string(), // "TryHackMe" / "ICMTC" / "ASCWG" ...
      name: z.string(),
      result: z.string().default(''), // the claim, e.g. "Rank #3 Egypt"
      date: z.coerce.date().optional(),
      proof: z.string().default(''), // must be http(s) to render
      writeup: z.string().default(''), // internal path, e.g. '/writeups/<slug>'
    }),
});

/**
 * Journey — vertical timeline (plan/04 F-07). A station that carries a
 * verifiable claim (`claim`) must link a real `proof` URL or it is held back.
 * Narrative-only stations render without one. `date` is optional so structure
 * can exist before real dates are supplied — dated stations sort first.
 */
const journey = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/journey' }),
  schema: () =>
    z.object({
      date: z.coerce.date().optional(),
      event: l10nText,
      learned: l10nText,
      claim: z.string().default(''), // rank / cert / score; proof required when set
      proof: z.string().default(''),
    }),
});

/**
 * Arsenal — capability table, never an icon grid (plan/04 F-05, §3 "arsenal").
 * One YAML file per domain; each row maps the tools to where they were
 * actually used (`usedOn`, an internal link to a project or writeup).
 */
const arsenal = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/arsenal' }),
  schema: () =>
    z.object({
      domain: l10nText,
      rows: z
        .array(
          z.object({
            tools: z.array(z.string()).min(1),
            usedOn: z.string().default(''), // internal path; flagged when empty
          })
        )
        .min(1),
    }),
});

export const collections = { writeups, projects, labs, journey, arsenal };
