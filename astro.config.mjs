// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
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
  integrations: [mdx(), sitemap()],
});
