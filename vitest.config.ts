/// <reference types="vitest/config" />
// getViteConfig resolves the astro:* virtual modules (astro:content,
// astro:i18n) the same way the build does, so src/lib is tested as shipped.
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
