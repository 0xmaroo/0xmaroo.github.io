#!/usr/bin/env node
// Scaffold a new note so the F-06 stream starts from a structure, not a blank
// file — the sibling of scripts/new-writeup.mjs.
//
// Generates src/content/notes/<lang>/<slug>.mdx with:
//  - frontmatter that satisfies the Zod schema in src/content.config.ts, and
//  - for the two summary kinds, the five-section skeleton from
//    plan/04-features.md F-06 (the reference · who it is for · three ideas ·
//    what I disagree with · how I applied it).
//
// The enum values, the summary length bounds and the title max are READ from
// the schema source (not copied here), so a schema change either keeps working
// or fails this script loudly — the generator can never drift silently.
//
// Dev tooling only: CLI text is English on purpose. It is not site UI, so
// CLAUDE.md rule 3 (UI strings come from src/i18n/ui.ts) does not apply here.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import * as prettier from 'prettier';
import readline from 'node:readline/promises';

const ROOT = process.cwd();
const CONTENT_CONFIG = join(ROOT, 'src', 'content.config.ts');
const NOTES_DIR = join(ROOT, 'src', 'content', 'notes');
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MARKER = 'TODO(copy)';

const USAGE = `Usage: npm run new:note -- [options]

Options (anything omitted is asked for interactively):
  --slug <s>             lowercase a-z0-9- only; derived from --title when omitted
  --title <s>            required, max length comes from the schema
  --lang <en|ar>         default: en
  --kind <s>             default: note
  --tags <a,b|a --tags b>  repeatable and/or comma-separated
  --source-name <s>      required for the summary kinds — the work's name
  --source-author <s>    required for the summary kinds
  --source-url <s>       optional; left empty until a real link exists
  --help                 this text`;

// ── Fail fast ────────────────────────────────────────────────────────────────

const fatal = (msg, code = 1) => {
  console.error(`ERROR: ${msg}`);
  process.exit(code);
};

// ── Read the schema from src/content.config.ts ──────────────────────────────

function readSchema() {
  const src = readFileSync(CONTENT_CONFIG, 'utf8');
  const start = src.indexOf('const notes = defineCollection(');
  const end = src.indexOf('const labs = defineCollection(');
  if (start === -1 || end === -1 || end < start) {
    fatal(`could not locate the notes collection in ${relative(ROOT, CONTENT_CONFIG)}`);
  }
  const block = src.slice(start, end);

  const need = (re, what) => {
    const m = block.match(re);
    if (!m) {
      fatal(
        `could not read ${what} from ${relative(ROOT, CONTENT_CONFIG)} — ` +
          'the schema changed, update scripts/new-note.mjs'
      );
    }
    return m;
  };

  const enumOf = (field) =>
    need(new RegExp(`${field}:\\s*z\\.enum\\(\\[([^\\]]*)\\]\\)`), `enum for \`${field}\``)[1]
      .split(',')
      .map((v) => v.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);

  const summary = need(
    /summary:\s*z\.string\(\)\.min\((\d+)\)\.max\((\d+)\)/,
    'the summary length bounds'
  );

  const summaryKindsMatch = src.match(/const NOTE_SUMMARY_KINDS = \[([^\]]*)\]/);
  if (!summaryKindsMatch) {
    fatal(
      `could not read NOTE_SUMMARY_KINDS from ${relative(ROOT, CONTENT_CONFIG)} — ` +
        'the schema changed, update scripts/new-note.mjs'
    );
  }
  const summaryKinds = summaryKindsMatch[1]
    .split(',')
    .map((v) => v.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);

  return {
    titleMax: Number(need(/title:\s*z\.string\(\)\.max\((\d+)\)/, 'the title max')[1]),
    summaryMin: Number(summary[1]),
    summaryMax: Number(summary[2]),
    langs: enumOf('lang'),
    kinds: enumOf('kind'),
    summaryKinds,
  };
}

// ── CLI parsing (no dependency; --flag value | --flag=value) ────────────────

const SINGULAR = new Set([
  'slug',
  'title',
  'lang',
  'kind',
  'sourceName',
  'sourceAuthor',
  'sourceUrl',
]);
const REPEATABLE = new Set(['tags']);

function parseArgs(argv) {
  const flags = { tags: [] };
  for (let i = 0; i < argv.length; i++) {
    let name = argv[i];
    if (name === '--help' || name === '-h') {
      console.log(USAGE);
      process.exit(0);
    }
    if (!name.startsWith('--')) fatal(`unexpected argument "${name}"\n\n${USAGE}`, 2);
    let value;
    const eq = name.indexOf('=');
    if (eq !== -1) {
      value = name.slice(eq + 1);
      name = name.slice(2, eq);
    } else {
      name = name.slice(2);
      value = argv[++i];
      if (value === undefined) fatal(`option --${name} needs a value\n\n${USAGE}`, 2);
    }
    name = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase()); // --source-name → sourceName
    if (REPEATABLE.has(name)) {
      flags[name].push(
        ...value
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean)
      );
    } else if (SINGULAR.has(name)) {
      if (flags[name] !== undefined) fatal(`option --${name} given twice`, 2);
      flags[name] = value;
    } else {
      fatal(`unknown option --${name}\n\n${USAGE}`, 2);
    }
  }
  return flags;
}

// ── Interactive fallback (node:readline/promises, no prompt dependency) ─────

let rl = null;
let stdinClosed = false;
const lineQueue = [];

// A persistent 'line' queue instead of rl.question(): when answers arrive in a
// burst (piped stdin), lines that land between two questions are buffered
// here instead of being dropped, and closed stdin resolves null rather than
// leaving the promise unsettled (rl.question() would hang forever).
function ensureReadline() {
  if (rl) return;
  rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.on('line', (line) => lineQueue.push(line));
  rl.on('close', () => {
    stdinClosed = true;
  });
}

function ask(prompt) {
  ensureReadline();
  process.stdout.write(prompt);
  if (lineQueue.length > 0) return Promise.resolve(lineQueue.shift());
  if (stdinClosed) return Promise.resolve(null);
  return new Promise((resolve) => {
    const check = () => {
      if (lineQueue.length > 0) {
        cleanup();
        resolve(lineQueue.shift());
      } else if (stdinClosed) {
        cleanup();
        resolve(null);
      }
    };
    const cleanup = () => {
      rl.off('line', check);
      rl.off('close', check);
    };
    rl.on('line', check);
    rl.on('close', check);
  });
}

const noInput = () =>
  fatal('no interactive input available — pass the missing values as flags instead');

async function askRequired(label) {
  for (;;) {
    const answer = await ask(`${label}: `);
    if (answer === null) noInput();
    const value = answer.trim();
    if (value) return value;
    console.error(`  ${label} cannot be empty`);
  }
}

async function askEnum(label, values, fallback) {
  const hint = `${label} (${values.join('|')})${fallback ? ` [${fallback}]` : ''}: `;
  for (;;) {
    const answer = await ask(hint);
    if (answer === null) return fallback; // stdin closed → default, not fatal
    const value = answer.trim();
    if (!value && fallback) return fallback;
    if (!value) return undefined; // optional field, deliberately omitted
    if (values.includes(value)) return value;
    console.error(`  invalid ${label} "${value}" — allowed: ${values.join(', ')}`);
  }
}

// ── Values: flag if given, prompt otherwise; validated against the schema ──

async function requiredString(flags, name, label) {
  if (flags[name] !== undefined) {
    const value = flags[name].trim();
    if (!value) fatal(`--${name} cannot be empty`);
    return value;
  }
  return askRequired(label);
}

async function enumValue(flags, name, label, values, fallback) {
  if (flags[name] !== undefined) {
    const value = flags[name].trim();
    if (!value) return fallback; // empty flag value = use the default
    if (values.includes(value)) return value;
    fatal(`invalid --${name} "${value}" — allowed: ${values.join(', ')}`);
  }
  return (await askEnum(label, values, fallback)) ?? fallback;
}

async function optionalValue(flags, name, label) {
  if (flags[name] !== undefined) {
    const value = flags[name].trim();
    if (!value) fatal(`--${name} cannot be empty — omit the flag entirely instead`);
    return value;
  }
  const answer = await ask(`${label} (empty to skip): `);
  return answer === null ? undefined : answer.trim() || undefined;
}

async function optionalList(flags, name, label) {
  if (flags[name].length > 0) return flags[name];
  const answer = await ask(`${label} (comma-separated, empty to skip): `);
  if (answer === null) return [];
  return answer
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

// ── Slug ─────────────────────────────────────────────────────────────────────

const slugify = (title) =>
  title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

async function resolveSlug(flags, title) {
  if (flags.slug !== undefined) {
    if (!SLUG_RE.test(flags.slug)) {
      fatal(
        `invalid slug "${flags.slug}" — lowercase a-z 0-9 and single hyphens only; ` +
          'the slug is never rewritten automatically'
      );
    }
    return flags.slug;
  }
  const derived = slugify(title);
  if (!SLUG_RE.test(derived)) {
    fatal(
      `could not derive a slug from the title (needs latin letters or digits) — ` +
        'pass --slug explicitly'
    );
  }
  // Confirm interactively only when there is a terminal to confirm with;
  // piped/CI runs take the derivation without blocking on stdin.
  if (!process.stdin.isTTY || stdinClosed) return derived;
  const answer = await ask(`slug [${derived}]: `);
  if (answer === null) return derived;
  const value = answer.trim() || derived;
  if (!SLUG_RE.test(value)) {
    fatal(`invalid slug "${value}" — lowercase a-z 0-9 and single hyphens only`);
  }
  return value;
}

// ── Placeholder copy: long enough to VALIDATE, still marked TODO(copy) ──────

const SUMMARY_PLACEHOLDERS = {
  en: `${MARKER}: one or two sentences — what this note captures and why it was worth writing down. This is the card text and the meta description, so it has to be written before publishing.`,
  ar: `${MARKER}: جملة أو جملتان — إيه اللي بتسجّله الملاحظة دي وليه تستاهل التدوين. ده نص الكارت والـ meta description، فلازم يتكتب قبل النشر.`,
};

const summaryPlaceholder = (lang) => {
  const text = SUMMARY_PLACEHOLDERS[lang];
  if (!text) fatal(`no placeholder summary for locale "${lang}" — add one before generating`);
  return text;
};

// ── Body skeletons (plan/04-features.md F-06) ───────────────────────────────
//
// Every comment below is a SINGLE-LINE {/* ... */} on purpose. MDX rejects
// HTML comments outright, and Prettier's markdown formatter (not MDX-aware)
// rewrites multi-line {/* ... */} blocks by moving the asterisks — which
// breaks the comment. The single-line form is the only one that is both valid
// MDX and byte-stable under `prettier --check`.
//
// The copyright warning is a product requirement (F-06), not a nicety: a
// summary is the author's own understanding in their own words. It lives in
// the generated file so it is in front of the author at the moment of writing.

const INTRO_COMMENTS = {
  en: `{/* Layout components need no imports here — Note.astro injects Callout, Payload, FixDiff, DeadEnd and Terminal. */}`,
  ar: `{/* المكونات هنا من غير أي import — Note.astro بيوفّر Callout وPayload وFixDiff وDeadEnd وTerminal جوه الصفحة. */}`,
};

const COPYRIGHT_COMMENTS = {
  en: `{/* Copyright — plan/04-features.md F-06: a summary is your own understanding in your own words. Never copy paragraphs from the work; only a very short quote, with a reference, when strictly necessary. */}`,
  ar: `{/* حقوق النشر — plan/04-features.md F-06: الملخص فهمك أنت بكلامك أنت. ما تنقلش فقرات من العمل؛ اقتباس قصير جداً مع مرجع لما يكون ضروري بس. */}`,
};

// The five fixed sections F-06 gives every summary — shipped as structure,
// never as prose: each body is the literal TODO(copy) marker.
const SUMMARY_SECTIONS = {
  en: [
    '01 — The reference',
    '02 — Who it is for, and who it is not for',
    '03 — Three ideas that changed how I work',
    '04 — What I disagree with',
    '05 — How I actually applied it',
  ],
  ar: [
    '٠١ — المرجع',
    '٠٢ — لمين ده مفيد، ولمين مش مفيد',
    '٠٣ — ثلاث أفكار غيّرت طريقة شغلي',
    '٠٤ — اللي مش موافق عليه',
    '٠٥ — إزاي طبقته فعلياً',
  ],
};

const introComment = (lang) => {
  const text = INTRO_COMMENTS[lang];
  if (!text) fatal(`no intro comment for locale "${lang}" — add one before generating`);
  return text;
};

const copyrightComment = (lang) => {
  const text = COPYRIGHT_COMMENTS[lang];
  if (!text) fatal(`no copyright comment for locale "${lang}" — add one before generating`);
  return text;
};

const summarySections = (lang) => {
  const sections = SUMMARY_SECTIONS[lang];
  if (!sections) fatal(`no summary sections for locale "${lang}" — add one before generating`);
  return sections;
};

// ── File assembly ────────────────────────────────────────────────────────────

const yamlList = (items) =>
  items.length ? `[${items.map((x) => JSON.stringify(x)).join(', ')}]` : '[]';

function buildFile(values) {
  const isSummary = values.source !== undefined;
  const lines = [
    '---',
    `title: ${JSON.stringify(values.title)}`,
    `summary: ${JSON.stringify(summaryPlaceholder(values.lang))}`,
    `lang: ${JSON.stringify(values.lang)}`,
    `publishedAt: ${new Date().toISOString().slice(0, 10)}`,
    `kind: ${JSON.stringify(values.kind)}`,
    `tags: ${yamlList(values.tags)}`,
  ];
  if (isSummary) {
    lines.push(
      'source:',
      `  name: ${JSON.stringify(values.source.name)}`,
      `  author: ${JSON.stringify(values.source.author)}`,
      `  url: ${JSON.stringify(values.source.url ?? '')}`
    );
  }
  lines.push(
    '# optional per the schema, omit until needed: translationOf, updatedAt',
    'visibility:',
    '  draft: true',
    '  unlisted: false',
    '  featured: false',
    '  noindex: false',
    '  hideFrom: []',
    '---',
    '',
    introComment(values.lang),
    ''
  );
  if (isSummary) {
    lines.push(copyrightComment(values.lang), '');
    summarySections(values.lang).forEach((heading) => {
      lines.push(`## ${heading}`, '', MARKER, '');
    });
  } else {
    // A plain note or TIL has no fixed template — the body starts empty.
    lines.push(MARKER, '');
  }
  return lines.join('\n').replace(/\n{3,}$/g, '\n');
}

// ── Main ─────────────────────────────────────────────────────────────────────

const schema = readSchema();

// The placeholder summaries are the one piece of generated frontmatter that
// could silently break the build if the schema bounds move — check them
// against the bounds read from the schema itself, for every locale it defines.
for (const lang of schema.langs) {
  const len = summaryPlaceholder(lang).length;
  if (len < schema.summaryMin || len > schema.summaryMax) {
    fatal(
      `the ${lang} placeholder summary is ${len} chars — the schema requires ` +
        `${schema.summaryMin}–${schema.summaryMax}. Fix SUMMARY_PLACEHOLDERS.`
    );
  }
}

const flags = parseArgs(process.argv.slice(2));

// Fail fast on everything the flags alone can answer — a bad value or an
// existing file must be rejected BEFORE any interactive prompt appears.
const refuseIfExists = (lang, slug) => {
  const outPath = join(NOTES_DIR, lang, `${slug}.mdx`);
  if (existsSync(outPath)) {
    fatal(`${relative(ROOT, outPath)} already exists — refusing to overwrite it`);
  }
};
if (flags.slug !== undefined && !SLUG_RE.test(flags.slug)) {
  fatal(
    `invalid slug "${flags.slug}" — lowercase a-z 0-9 and single hyphens only; ` +
      'the slug is never rewritten automatically'
  );
}
if (flags.title !== undefined && flags.title.trim().length > schema.titleMax) {
  fatal(
    `title is ${flags.title.trim().length} chars — the schema allows at most ${schema.titleMax}`
  );
}
for (const [name, values] of [
  ['lang', schema.langs],
  ['kind', schema.kinds],
]) {
  const value = flags[name];
  if (value !== undefined && value.trim() && !values.includes(value.trim())) {
    fatal(`invalid --${name} "${value.trim()}" — allowed: ${values.join(', ')}`);
  }
}
if (flags.slug !== undefined && flags.lang !== undefined) {
  refuseIfExists(flags.lang.trim(), flags.slug);
}

const values = {};
values.title = await requiredString(flags, 'title', 'title');
if (values.title.length > schema.titleMax) {
  fatal(`title is ${values.title.length} chars — the schema allows at most ${schema.titleMax}`);
}
values.lang = await enumValue(flags, 'lang', 'lang', schema.langs, schema.langs[0]);
values.kind = await enumValue(
  flags,
  'kind',
  'kind',
  schema.kinds,
  schema.kinds.includes('note') ? 'note' : schema.kinds[0]
);

// The schema refinement requires `source` on the summary kinds — collect it or
// the generated file would fail `astro check` before the author ever opens it.
if (schema.summaryKinds.includes(values.kind)) {
  values.source = {
    name: await requiredString(flags, 'sourceName', "source — the work's name"),
    author: await requiredString(flags, 'sourceAuthor', "source — the work's author"),
    url:
      (await optionalValue(
        flags,
        'sourceUrl',
        'source — URL (a real http(s) link; empty until it exists)'
      )) ?? '',
  };
}

values.tags = await optionalList(flags, 'tags', 'tags list');
values.slug = await resolveSlug(flags, values.title);

if (rl) rl.close();

refuseIfExists(values.lang, values.slug);
const outPath = join(NOTES_DIR, values.lang, `${values.slug}.mdx`);
const relPath = relative(ROOT, outPath);

const raw = buildFile(values);
const prettierConfig = (await prettier.resolveConfig(outPath)) ?? {};
const formatted = await prettier.format(raw, { ...prettierConfig, filepath: outPath });

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, formatted);

const summaryLen = summaryPlaceholder(values.lang).length;
console.log(`Created   ${relPath}`);
console.log(
  `Summary   ${MARKER} placeholder, ${summaryLen} chars ` +
    `(schema: ${schema.summaryMin}–${schema.summaryMax}) — it validates today, replace it before publishing`
);
if (values.source) {
  console.log('Sections  the five F-06 sections are scaffolded — bodies are TODO(copy).');
  console.log(
    '          Copyright: a summary is your own words, never copied paragraphs — plan/04-features.md F-06.'
  );
}
console.log('Next      write the body, then flip visibility.draft to false.');
