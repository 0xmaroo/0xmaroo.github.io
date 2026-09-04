import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import type { Language } from '../i18n/ui';
import { ui } from '../i18n/ui';
import { site } from '../config/site';

/**
 * Build-time default Open Graph image per locale (plan/03 design tokens,
 * plan/05 Phase 3). satori renders the layout to SVG with the TTF masters in
 * `src/fonts/og/` (Arabic shaping included), resvg-js rasterizes it to PNG.
 * Runs in the `astro:build:start` hook so the PNG lands in `public/og/`
 * before the static copy.
 */

const FONT_DIR = join(process.cwd(), 'src', 'fonts', 'og');
const font = (file: string): ArrayBuffer =>
  readFileSync(join(FONT_DIR, file)).buffer as ArrayBuffer;

const mono = {
  regular: font('IBMPlexMono-Regular.ttf'),
  medium: font('IBMPlexMono-Medium.ttf'),
  bold: font('IBMPlexMono-Bold.ttf'),
};
const sans = {
  regular: font('IBMPlexSans-Regular.ttf'),
  semibold: font('IBMPlexSans-SemiBold.ttf'),
};
const sansAr = {
  regular: font('IBMPlexSansArabic-Regular.ttf'),
  medium: font('IBMPlexSansArabic-Medium.ttf'),
};
const cond = {
  medium: font('IBMPlexSansCondensed-Medium.ttf'),
};

const C = {
  ink900: '#080a0f',
  textHi: '#e8ebf0',
  textLo: '#8f9aac',
  textDim: '#737c8d',
  blue400: '#7fa6ff',
  blue500: '#4e7cf6',
  sulfur400: '#e3c567',
};

const W = 1200;
const H = 630;
const PAD = 64;
const GRID = 60;

type El = {
  type: string;
  key?: string;
  props: {
    style: Record<string, unknown>;
    children?: El[] | string | number;
    [k: string]: unknown;
  };
};

const el = (
  type: string,
  style: Record<string, unknown>,
  children?: El[] | string | number
): El => ({
  type,
  props: { style, children },
});

const gridLines = (): El[] => {
  const lines: El[] = [];
  for (let x = GRID; x < W; x += GRID) {
    lines.push(
      el('div', {
        position: 'absolute',
        insetInlineStart: `${x}px`,
        top: 0,
        width: 1,
        height: H,
        background: 'rgba(78,124,246,0.07)',
      })
    );
  }
  for (let y = GRID; y < H; y += GRID) {
    lines.push(
      el('div', {
        position: 'absolute',
        top: `${y}px`,
        insetInlineStart: 0,
        width: W,
        height: 1,
        background: 'rgba(78,124,246,0.07)',
      })
    );
  }
  return lines;
};

const frame = (lang: Language): El => {
  const t = ui[lang];
  const isAr = lang === 'ar';

  const text = el('div', { display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 720 }, [
    el(
      'div',
      { display: 'flex', fontFamily: 'Mono', fontSize: 20, color: C.blue400, letterSpacing: 2 },
      t['hero.file']
    ),
    el(
      'div',
      {
        display: 'flex',
        direction: 'ltr',
        alignItems: 'baseline',
        gap: 8,
        fontFamily: 'Mono',
        fontSize: 112,
        fontWeight: 700,
        color: C.textHi,
        letterSpacing: -2,
      },
      [el('span', {}, '0x'), el('span', { color: C.sulfur400 }, 'MARO')]
    ),
    el(
      'div',
      {
        display: 'flex',
        direction: isAr ? 'rtl' : 'ltr',
        fontFamily: 'Body',
        fontWeight: isAr ? 500 : 600,
        fontSize: 30,
        lineHeight: isAr ? 1.85 : 1.5,
        color: C.textLo,
        maxWidth: 660,
      },
      t['hero.sub']
    ),
  ]);

  const corner = el('div', {
    position: 'absolute',
    top: PAD,
    insetInlineStart: PAD,
    width: 28,
    height: 28,
    borderInlineStart: `2px solid ${C.blue500}`,
    borderBlockStart: `2px solid ${C.blue500}`,
  });

  const brand = el(
    'div',
    {
      position: 'absolute',
      bottom: PAD,
      insetInlineEnd: PAD,
      display: 'flex',
      fontFamily: 'Mono',
      fontSize: 18,
      color: C.textDim,
      letterSpacing: 1,
    },
    `${site.domain.replace('https://', '')} · §`
  );

  return el(
    'div',
    {
      display: 'flex',
      width: W,
      height: H,
      padding: PAD,
      position: 'relative',
      background: C.ink900,
      alignItems: 'flex-end',
      direction: 'ltr',
    },
    [...gridLines(), corner, text, brand]
  );
};

const fonts = (lang: Language) => {
  const base = [
    { name: 'Mono', data: mono.regular, weight: 400 as const, style: 'normal' as const },
    { name: 'Mono', data: mono.medium, weight: 500 as const, style: 'normal' as const },
    { name: 'Mono', data: mono.bold, weight: 700 as const, style: 'normal' as const },
    { name: 'Cond', data: cond.medium, weight: 500 as const, style: 'normal' as const },
  ];
  return lang === 'ar'
    ? [
        ...base,
        { name: 'Body', data: sansAr.regular, weight: 400 as const, style: 'normal' as const },
        { name: 'Body', data: sansAr.medium, weight: 500 as const, style: 'normal' as const },
      ]
    : [
        ...base,
        { name: 'Body', data: sans.regular, weight: 400 as const, style: 'normal' as const },
        { name: 'Body', data: sans.semibold, weight: 600 as const, style: 'normal' as const },
      ];
};

/** satori → SVG → resvg → PNG, the one rasterizer every OG image goes through. */
const toPng = (root: El, lang: Language): Promise<Buffer> =>
  satori(root, { width: W, height: H, fonts: fonts(lang), embedFont: true }).then((svg) =>
    new Resvg(svg, { fitTo: { mode: 'width', value: W }, background: C.ink900 }).render().asPng()
  );

/**
 * Locale-independent route of an entry OG image; `getRelativeLocaleUrl()` turns
 * it into `/og/...` or `/ar/og/...`, matching the endpoints in `src/pages/og`
 * and `src/pages/ar/og` (same-slug EN/AR entries need distinct routes).
 */
export const ogImagePath = (section: 'writeups' | 'projects', slug: string): string =>
  `og/${section}/${slug}.png`;

/** Input for one entry image (writeup or project). */
export interface EntryOg {
  lang: Language;
  title: string;
  /** Technical mono eyebrow, always LTR: 'CASE 001 · WEB' / '§03 · gymos'. */
  eyebrow: string;
  /** Line under the title; `technical` renders mono/LTR (CWE ids, slugs). */
  meta?: { text: string; technical: boolean };
}

const TITLE_FONT = 64;
const TITLE_MAX_LINES = 3;
// Wrap width reserves the corner where the brand mark sits, so a full
// three-line title can never run under it.
const BRAND_RESERVE = 200;
const TITLE_WRAP = W - PAD * 2 - BRAND_RESERVE;
// Average advance width of the Plex faces at semibold; satori has no
// measurement API, so wrapping is cut by estimate and hard-capped.
const TITLE_CHAR_WIDTH = 0.55;

/**
 * Deterministic word wrap: a title can never exceed TITLE_MAX_LINES, and a
 * line that would overflow is cut on a word boundary with an ellipsis, so the
 * frame (and the brand mark) is never overrun.
 */
const wrapTitle = (title: string): string[] => {
  const maxChars = Math.floor(TITLE_WRAP / (TITLE_FONT * TITLE_CHAR_WIDTH));
  const cut = (word: string): string => `${word.slice(0, maxChars - 1)}…`;
  const lines: string[] = [];
  let line = '';
  let truncated = false;

  for (const word of title.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= maxChars) {
      line = next;
      continue;
    }
    // `word` has to start a new line — when the current one is the last
    // slot, the title is truncated here on a word boundary.
    if (lines.length === TITLE_MAX_LINES - 1) {
      truncated = true;
      break;
    }
    if (!line) {
      line = cut(word);
      continue;
    }
    lines.push(line);
    line = word.length > maxChars ? cut(word) : word;
  }
  lines.push(line);
  if (truncated && !lines[TITLE_MAX_LINES - 1].endsWith('…')) {
    lines[TITLE_MAX_LINES - 1] += '…';
  }
  return lines;
};

/**
 * The entry variant of the blueprint frame: eyebrow, wrapped title, meta.
 *
 * Positioning uses physical properties (`left`/`right`/`borderLeft`…), mirrored
 * by hand for Arabic: satori (0.12) silently DROPS the logical ones
 * (`insetInlineStart`, `borderInlineStart`, …) and ignores `direction` for
 * layout, so an RTL frame must swap sides explicitly. The shared background
 * (`gridLines()`, colours, fonts, sizes) is untouched — the default images
 * keep rendering exactly as before.
 */
const entryFrame = (entry: EntryOg): El => {
  const isAr = entry.lang === 'ar';
  const titleLines = wrapTitle(entry.title);

  const column: El[] = [
    el(
      'div',
      {
        display: 'flex',
        fontFamily: 'Mono',
        fontSize: 20,
        color: C.blue400,
        letterSpacing: 2,
      },
      entry.eyebrow
    ),
    el(
      'div',
      {
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Body',
        fontWeight: isAr ? 500 : 600,
        fontSize: TITLE_FONT,
        lineHeight: isAr ? 1.85 : 1.25,
        color: C.textHi,
        textAlign: isAr ? 'right' : 'left',
        maxWidth: TITLE_WRAP,
      },
      titleLines.map((l) => el('div', { display: 'flex' }, l))
    ),
  ];
  if (entry.meta) {
    column.push(
      el(
        'div',
        {
          display: 'flex',
          fontFamily: entry.meta.technical ? 'Mono' : 'Body',
          fontWeight: entry.meta.technical ? 400 : isAr ? 500 : 600,
          fontSize: entry.meta.technical ? 18 : 26,
          lineHeight: entry.meta.technical ? 1.5 : isAr ? 1.85 : 1.5,
          color: entry.meta.technical ? C.textLo : C.sulfur400,
          letterSpacing: entry.meta.technical ? 1 : 0,
          textAlign: entry.meta.technical || !isAr ? 'left' : 'right',
        },
        entry.meta.text
      )
    );
  }

  const corner = el('div', {
    position: 'absolute',
    top: PAD,
    [isAr ? 'right' : 'left']: PAD,
    width: 28,
    height: 28,
    [isAr ? 'borderRight' : 'borderLeft']: `2px solid ${C.blue500}`,
    borderTop: `2px solid ${C.blue500}`,
  });

  const brand = el(
    'div',
    {
      position: 'absolute',
      bottom: PAD,
      [isAr ? 'left' : 'right']: PAD,
      display: 'flex',
      fontFamily: 'Mono',
      fontSize: 18,
      color: C.textDim,
      letterSpacing: 1,
    },
    `${site.domain.replace('https://', '')} · §`
  );

  return el(
    'div',
    {
      display: 'flex',
      width: W,
      height: H,
      padding: PAD,
      position: 'relative',
      background: C.ink900,
      alignItems: 'flex-end',
      justifyContent: isAr ? 'flex-end' : 'flex-start',
    },
    [
      ...gridLines(),
      corner,
      el('div', { display: 'flex', flexDirection: 'column', gap: 24 }, column),
      brand,
    ]
  );
};

/** Render and write `<public>/og/og-default-<lang>.png`. */
export async function generateDefaultOgImages(): Promise<string[]> {
  const outDir = join(process.cwd(), 'public', 'og');
  mkdirSync(outDir, { recursive: true });
  const written: string[] = [];

  for (const lang of ['en', 'ar'] as Language[]) {
    const png = await toPng(frame(lang), lang);
    const out = join(outDir, `og-default-${lang}.png`);
    writeFileSync(out, png);
    written.push(out);
  }
  return written;
}

/** Render ONE entry (title, eyebrow with case number, meta/CWE, language). */
export async function renderEntryOgImage(entry: EntryOg): Promise<Buffer> {
  return toPng(entryFrame(entry), entry.lang);
}
