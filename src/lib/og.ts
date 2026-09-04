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

/**
 * Blueprint grid behind every OG image.
 *
 * PHYSICAL PROPERTIES ARE DELIBERATE HERE. satori (0.12) parses its own subset
 * of CSS and silently drops logical properties — `insetInlineStart`,
 * `borderInlineStart`, `borderBlockStart` — leaving the element at its static
 * position with no border at all. Using them here previously collapsed every
 * vertical grid line onto the left edge, erased the corner mark, and dropped
 * the brand line on top of the description text in the default images.
 *
 * A full-canvas grid is symmetric, so `left` is correct in both directions.
 * Anything direction-dependent (corner, brand) mirrors by hand on `isAr`.
 * Do NOT "fix" this back to logical properties: CLAUDE.md rule 1 governs CSS a
 * browser parses, and satori is not a browser.
 */
const gridLines = (): El[] => {
  const lines: El[] = [];
  for (let x = GRID; x < W; x += GRID) {
    lines.push(
      el('div', {
        position: 'absolute',
        left: `${x}px`,
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
        left: 0,
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
    textFlow(t['hero.sub'], lang, SUB_FONT, {
      fontFamily: 'Body',
      fontWeight: isAr ? 500 : 600,
      fontSize: SUB_FONT,
      lineHeight: isAr ? 1.85 : 1.5,
      color: C.textLo,
      maxWidth: SUB_WRAP,
    }),
  ]);

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
// Wrap width reserves the corner where the brand mark sits, so a full
// three-line title can never run under it.
const BRAND_RESERVE = 200;
const TITLE_WRAP = W - PAD * 2 - BRAND_RESERVE;
// Average advance width of the Plex faces at semibold; satori has no
// measurement API, so wrapping is cut by estimate and hard-capped.

/** Default-frame lead paragraph metrics (same char-width heuristic). */
const SUB_FONT = 30;
const SUB_WRAP = 660;

/**
 * Deterministic word wrap: a title can never exceed TITLE_MAX_LINES, and a
 * line that would overflow is cut on a word boundary with an ellipsis, so the
 * frame (and the brand mark) is never overrun.
 */
/**
 * Arabic text layout for satori — flow, not measurement.
 *
 * satori (0.12) does not run the bidi algorithm. It shapes Arabic glyphs
 * correctly (letters join) but places whitespace-separated tokens
 * left-to-right, so a multi-word Arabic sentence renders with its words in
 * reverse reading order. og-default-ar.png shipped that way.
 *
 * Reordering by hand only moves the problem: you then have to predict where
 * satori will break the line, and you cannot — it resolves U+0020 against an
 * arbitrary registered face and draws it far wider than the Arabic font's own
 * space, so any width model drifts (measured: a 629px line rendering at ~730px).
 * An under-measured line is silently re-wrapped by satori AFTER the reordering,
 * which scatters the words again.
 *
 * So no reordering and no measuring. Each word becomes a box and flex is asked
 * to flow them: `row-reverse` + `wrap` fills from the right and breaks onto the
 * next line, which IS Arabic text flow. Words are emitted in logical order and
 * the gap is ours, so there is nothing to calibrate and nothing to drift.
 *
 * Mixed content (plan/03 §3.2 rule 5 — "ثغرة SQL Injection في CVE-2021-44228")
 * works because a run of consecutive Latin tokens is emitted as ONE box with its
 * spaces intact: it stays internally left-to-right and the reversed flow places
 * it as a single unit.
 */
const RTL_CHAR = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

/** Gap between word boxes, in em — satori's own space glyph is unusable here. */
const WORD_GAP = 0.28;

/**
 * Arabic words individually, so a line may break between them; each run of
 * Latin tokens kept whole, so it stays left-to-right and never splits.
 */
const textBoxes = (text: string, lang: Language): string[] => {
  const words = text.split(/\s+/).filter(Boolean);
  if (lang !== 'ar') return words;
  const boxes: string[] = [];
  for (const word of words) {
    const prev = boxes[boxes.length - 1];
    if (!RTL_CHAR.test(word) && prev !== undefined && !RTL_CHAR.test(prev)) {
      boxes[boxes.length - 1] = `${prev} ${word}`;
    } else {
      boxes.push(word);
    }
  }
  return boxes;
};

/** A block of flowing text. Callers pass type styling; direction is handled here. */
const textFlow = (text: string, lang: Language, size: number, style: Record<string, unknown>): El =>
  el(
    'div',
    {
      display: 'flex',
      flexWrap: 'wrap',
      flexDirection: lang === 'ar' ? 'row-reverse' : 'row',
      alignItems: 'baseline',
      columnGap: WORD_GAP * size,
      ...style,
    },
    textBoxes(text, lang).map((w) => el('div', { display: 'flex', flexShrink: 0 }, w))
  );

const entryFrame = (entry: EntryOg): El => {
  const isAr = entry.lang === 'ar';

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
    textFlow(entry.title, entry.lang, TITLE_FONT, {
      fontFamily: 'Body',
      fontWeight: isAr ? 500 : 600,
      fontSize: TITLE_FONT,
      lineHeight: isAr ? 1.85 : 1.25,
      color: C.textHi,
      maxWidth: TITLE_WRAP,
    }),
  ];
  if (entry.meta) {
    column.push(
      entry.meta.technical
        ? // CWE ids and slugs are identifiers: always mono, always LTR.
          el(
            'div',
            {
              display: 'flex',
              fontFamily: 'Mono',
              fontWeight: 400,
              fontSize: 18,
              lineHeight: 1.5,
              color: C.textLo,
              letterSpacing: 1,
            },
            entry.meta.text
          )
        : textFlow(entry.meta.text, entry.lang, 26, {
            fontFamily: 'Body',
            fontWeight: isAr ? 500 : 600,
            fontSize: 26,
            lineHeight: isAr ? 1.85 : 1.5,
            color: C.sulfur400,
            maxWidth: TITLE_WRAP,
          })
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
