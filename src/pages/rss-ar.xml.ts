import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { forSurface, slugOf } from '../lib/content';
import { useTranslations } from '../i18n/utils';

export async function GET(context: APIContext) {
  const entries = await getCollection('writeups');
  const items = forSurface(entries, 'rss', 'ar');
  const site = context.site!;
  const t = useTranslations('ar');

  return rss({
    title: `0xMARO — ${t('writeups.title')}`,
    description: t('writeups.desc'),
    site: site.href,
    items: items.map((entry) => ({
      title: entry.data.title,
      description: entry.data.summary,
      pubDate: entry.data.publishedAt,
      link: new URL(`/ar/writeups/${slugOf(entry)}`, site).href,
    })),
    customData: '<language>ar</language>',
  });
}
