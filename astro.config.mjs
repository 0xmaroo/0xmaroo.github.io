// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { isSitemapExcluded } from './src/lib/sitemap-exclude';
import { generateDefaultOgImages } from './src/lib/og';

export default defineConfig({
  // GitHub Pages (user page → base stays '/'). This `site` line is the ONLY
  // line to change if a custom domain (e.g. 0xmaro.dev) is ever added.
  site: 'https://0xmaroo.github.io',
  base: '/',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ar'],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },
  markdown: {
    shikiConfig: {
      theme: 'css-variables', // token mapping lives in src/styles/prose.css
      wrap: false,
    },
  },
  // CSP (plan/08-quality-bar.md §8.1): the meta-tag CSP cannot carry nonces or
  // hashes, so `script-src 'self'` / `style-src 'self'` only hold if Astro never
  // inlines a script or a stylesheet into the HTML — and Astro inlines assets
  // under 4KB by default. Force everything into external /_astro/ files.
  build: {
    inlineStylesheets: 'never',
  },
  vite: {
    build: {
      assetsInlineLimit: 0,
      // One stylesheet instead of one per component. With inlining disabled for
      // the CSP, each split chunk became its own render-blocking request —
      // Lighthouse measured ~1.35s of blocking on a mobile article page across
      // five files. Bundling trades a slightly larger first payload for a single
      // round trip, and stays `style-src 'self'`.
      cssCodeSplit: false,
    },
  },
  integrations: [
    mdx(),
    sitemap({
      // plan/07-seo-and-growth.md §7.1: one sitemap for both languages, with
      // xhtml:link alternates between the versions. The integration derives the
      // pairs from the `/ar/` prefix, which is exactly how the routes are laid
      // out (plan/02 §2.2 — same slug in both locales).
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', ar: 'ar' },
      },
      filter: (page) => !isSitemapExcluded(page),
    }),
    {
      // Phase 3: default per-locale OG images into public/og/ before the
      // static copy, so the built HTML can reference them.
      name: 'og-images',
      hooks: {
        'astro:build:start': async () => {
          await generateDefaultOgImages();
        },
      },
    },
  ],
});
