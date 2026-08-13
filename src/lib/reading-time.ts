import type { Language } from '../i18n/ui';

/**
 * Reading time from raw markdown body text (plan/02 §2.4 — computed, not
 * stored). Arabic is denser, so it reads at a slower words-per-minute rate.
 */
export function readingTimeOf(body: string, lang: Language): number {
  const text = body
    .replace(/^```[\s\S]*?^```/gm, ' ') // fenced code blocks
    .replace(/`[^`]*`/g, ' ') // inline code
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // link text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/^[#>\-\*\+].*$/gm, ' ') // headings, lists, blockquotes
    .replace(/\s+/g, ' ')
    .trim();
  const words = text.length > 0 ? text.split(/\s+/).length : 0;
  const wpm = lang === 'ar' ? 180 : 200;
  return Math.max(1, Math.round(words / wpm));
}
