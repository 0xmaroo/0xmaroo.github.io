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
  integrations: [
    mdx(),
    sitemap({
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
