#!/usr/bin/env node
// Scaffold a new writeup so writing starts from a structure, not a blank file
// (plan/05-roadmap.md Phase 6, first item).
//
// Generates src/content/writeups/<lang>/<slug>.mdx with:
//  - frontmatter that satisfies the Zod schema in src/content.config.ts, and
//  - the seven-section body skeleton from plan/04-features.md F-02.
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
const WRITEUPS_DIR = join(ROOT, 'src', 'content', 'writeups');
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MARKER = 'TODO(copy)';

const USAGE = `Usage: npm run new:writeup -- [options]

Options (anything omitted is asked for interactively):
  --slug <s>           lowercase a-z0-9- only; derived from --title when omitted
  --title <s>          required, max length comes from the schema
  --lang <en|ar>       default: en
  --category <s>       default: web
  --target <s>         required, e.g. "HTB: Cascade" or "GymOS v1.2 — self-built"
  --target-type <s>    default: own-system
  --severity <s>       optional, omitted when empty
  --status <s>         default: wip
  --series <s>         optional, omitted when empty
  --cwe <a,b|a --cwe b>   repeatable and/or comma-separated
  --owasp <a,b|a --owasp b>
  --help               this text`;

// ── Fail fast ────────────────────────────────────────────────────────────────

const fatal = (msg, code = 1) => {
  console.error(`ERROR: ${msg}`);
  process.exit(code);
};

// ── Read the schema from src/content.config.ts ──────────────────────────────

function readSchema() {
  const src = readFileSync(CONTENT_CONFIG, 'utf8');
  const start = src.indexOf('const writeups = defineCollection(');
  const end = src.indexOf('const projects = defineCollection(');
  if (start === -1 || end === -1 || end < start) {
    fatal(`could not locate the writeups collection in ${relative(ROOT, CONTENT_CONFIG)}`);
  }
  const block = src.slice(start, end);

  const need = (re, what) => {
    const m = block.match(re);
    if (!m) {
      fatal(
        `could not read ${what} from ${relative(ROOT, CONTENT_CONFIG)} — ` +
          'the schema changed, update scripts/new-writeup.mjs'
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

  return {
    titleMax: Number(need(/title:\s*z\.string\(\)\.max\((\d+)\)/, 'the title max')[1]),
    summaryMin: Number(summary[1]),
    summaryMax: Number(summary[2]),
    langs: enumOf('lang'),
    categories: enumOf('category'),
    targetTypes: enumOf('targetType'),
    severities: enumOf('severity'),
    statuses: enumOf('status'),
  };
}

// ── CLI parsing (no dependency; --flag value | --flag=value) ────────────────

const SINGULAR = new Set([
  'slug',
  'title',
  'lang',
  'category',
  'target',
  'targetType',
  'severity',
  'status',
  'series',
]);
const REPEATABLE = new Set(['cwe', 'owasp']);

function parseArgs(argv) {
  const flags = { cwe: [], owasp: [] };
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
      value = name.slice(eq + 1); // the character after '=', not one past it
      name = name.slice(2, eq);
    } else {
      name = name.slice(2);
      value = argv[++i];
      if (value === undefined) fatal(`option --${name} needs a value\n\n${USAGE}`, 2);
    }
    name = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase()); // --target-type → targetType
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

// A persistent 'line' queue instead of rl.question(): when answers arrive in
// a burst (piped stdin), lines that land between two questions are buffered
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
    if (answer === null) return fallback; // stdin closed → default/omit, not fatal
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
    if (!value) return fallback; // empty flag value = use the default / omit
    if (values.includes(value)) return value;
    fatal(`invalid --${name} "${value}" — allowed: ${values.join(', ')}`);
  }
  // No fallback (severity) + empty answer → undefined → the field is omitted;
  // every required enum has a fallback, so nothing here is ever "missing".
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
  en: `${MARKER}: one or two sentences — the target, the vulnerability class and the outcome. This is the card text and the meta description, so it has to be written before publishing.`,
  ar: `${MARKER}: جملة أو جملتان — الهدف ونوع الثغرة والنتيجة. ده نص الكارت والـ meta description، فلازم يتكتب قبل النشر.`,
};

const summaryPlaceholder = (lang) => {
  const text = SUMMARY_PLACEHOLDERS[lang];
  if (!text) fatal(`no placeholder summary for locale "${lang}" — add one before generating`);
  return text;
};

// ── Seven-section skeleton (plan/04-features.md F-02) ───────────────────────
//
// Every comment below is a SINGLE-LINE {/* ... */} on purpose. MDX rejects
// HTML comments outright, and Prettier's markdown formatter (not MDX-aware)
// rewrites multi-line {/* ... */} blocks by moving the asterisks — which
// breaks the comment. The single-line form is the only one that is both valid
// MDX and byte-stable under `prettier --check`.

const SKELETONS = {
  en: {
    intro: `{/* Layout components need no imports here — Writeup.astro injects Callout, Payload, FixDiff, DeadEnd and Terminal. Sections 05 (dead ends) and 06 (the fix) are mandatory before publishing: plan/04-features.md F-02. */}`,
    sections: [
      [
        '01 — The target',
        `${MARKER}: what the target is, who built it (your own system? say so), and why this one was worth the time.`,
      ],
      [
        '02 — Recon',
        `${MARKER}: how the attack surface was mapped — scope, tooling, and what surfaced the vulnerable area first.`,
      ],
      [
        '03 — The bug',
        `${MARKER}: the technical root cause, the request/response that proved it, and the CWE / OWASP mapping.`,
      ],
      [
        '04 — Exploitation',
        `${MARKER}: sanitized PoC and the actual impact — what the bug really gave an attacker, no inflation.`,
      ],
      [
        '05 — Dead ends',
        `${MARKER}: what was tried and failed, and why it failed. A writeup never ships without this section.`,
      ],
      [
        '06 — The fix',
        `${MARKER}: the real code-level fix, not advice. A writeup never ships without this section.`,
      ],
      [
        '07 — What it teaches',
        `${MARKER}: the generalizable architectural lesson another developer can apply tomorrow.`,
      ],
    ],
    deadEndExample: `{/* Example — replace with the real dead end: <DeadEnd> <p>What was tried, why it looked promising, and why it did not work.</p> </DeadEnd> */}`,
    fixDiffExample: `{/* Example — replace with the real fix: <FixDiff before={\`// the vulnerable code\`} after={\`// the fixed code\`} /> */}`,
  },
  ar: {
    intro: `{/* المكونات هنا من غير أي import — Writeup.astro بيوفّر Callout وPayload وFixDiff وDeadEnd وTerminal جوه الصفحة. القسمان ٠٥ (الطرق المسدودة) و٠٦ (الإصلاح) إلزاميان قبل النشر: plan/04-features.md F-02. */}`,
    sections: [
      [
        '٠١ — الهدف',
        `${MARKER}: إيه هو الهدف ومين اللي بناه (لو نظامك أنت، قول كده صراحةً)، وليه يستحق الوقت.`,
      ],
      [
        '٠٢ — الاستطلاع',
        `${MARKER}: إزاي رسمت سطح الهجوم — النطاق والأدوات، وإيه أول حاجة ودّتك للمنطقة اللي فيها الثغرة.`,
      ],
      [
        '٠٣ — الثغرة',
        `${MARKER}: الجذر التقني للمشكلة مع الطلب/الاستجابة اللي أثبتها، وربطها بـ CWE وOWASP.`,
      ],
      [
        '٠٤ — الاستغلال',
        `${MARKER}: استغلال مُنظَّف (sanitized) والأثر الفعلي — اللي الثغرة فعلًا أعطته للمهاجم، من غير مبالغة.`,
      ],
      [
        '٠٥ — الطرق المسدودة',
        `${MARKER}: اللي جربته وما نفعش، وليه ما نفعش. المقال ما ينشرش من غير القسم ده.`,
      ],
      [
        '٠٦ — الإصلاح',
        `${MARKER}: الإصلاح الحقيقي على مستوى الكود، مش نصايح عامة. المقال ما ينشرش من غير القسم ده.`,
      ],
      ['٠٧ — ماذا يعلّمنا', `${MARKER}: الدرس المعماري العام اللي أي مطوّر يقدر يطبّقه بكرة.`],
    ],
    deadEndExample: `{/* مثال — اكتب مكانه الطريق المسدود الحقيقي: <DeadEnd> <p>اللي اتجرب، وليه كان شكله واعد، وليه فشل.</p> </DeadEnd> */}`,
    fixDiffExample: `{/* مثال — اكتب مكانه الإصلاح الحقيقي: <FixDiff before={\`// الكود قبل الإصلاح\`} after={\`// الكود بعد الإصلاح\`} /> */}`,
  },
};

const skeletonFor = (lang) => {
  const skeleton = SKELETONS[lang];
  if (!skeleton) fatal(`no body skeleton for locale "${lang}" — add one before generating`);
  return skeleton;
};

// ── File assembly ────────────────────────────────────────────────────────────

const yamlList = (items) =>
  items.length ? `[${items.map((x) => JSON.stringify(x)).join(', ')}]` : '[]';

function buildFile(values) {
  const skeleton = skeletonFor(values.lang);
  const lines = [
    '---',
    `title: ${JSON.stringify(values.title)}`,
    `summary: ${JSON.stringify(summaryPlaceholder(values.lang))}`,
    `lang: ${JSON.stringify(values.lang)}`,
    `publishedAt: ${new Date().toISOString().slice(0, 10)}`,
    `category: ${JSON.stringify(values.category)}`,
    'tags: []',
    `target: ${JSON.stringify(values.target)}`,
    `targetType: ${JSON.stringify(values.targetType)}`,
    `cwe: ${yamlList(values.cwe)}`,
    `owasp: ${yamlList(values.owasp)}`,
  ];
  if (values.severity) lines.push(`severity: ${JSON.stringify(values.severity)}`);
  lines.push(
    `status: ${JSON.stringify(values.status)}`,
    'hasFix: false',
    'fixCommits: []',
    'toolsUsed: []'
  );
  if (values.series) lines.push(`series: ${JSON.stringify(values.series)}`, 'seriesOrder: 1');
  lines.push(
    '# optional per the schema, omit until needed: translationOf, updatedAt, cover',
    'visibility:',
    '  draft: true',
    '  unlisted: false',
    '  featured: false',
    '  noindex: false',
    '  hideFrom: []',
    '---',
    '',
    skeleton.intro,
    ''
  );
  skeleton.sections.forEach(([heading, todo], i) => {
    lines.push(`## ${heading}`, '', todo, '');
    if (heading.startsWith('٠٥') || heading.startsWith('05'))
      lines.push(skeleton.deadEndExample, '');
    if (heading.startsWith('٠٦') || heading.startsWith('06'))
      lines.push(skeleton.fixDiffExample, '');
    if (i < skeleton.sections.length - 1) lines.push('');
  });
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
  const outPath = join(WRITEUPS_DIR, lang, `${slug}.mdx`);
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
  ['category', schema.categories],
  ['targetType', schema.targetTypes],
  ['severity', schema.severities],
  ['status', schema.statuses],
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
values.category = await enumValue(
  flags,
  'category',
  'category',
  schema.categories,
  schema.categories[0]
);
values.target = await requiredString(flags, 'target', 'target (e.g. "HTB: Cascade")');
values.targetType = await enumValue(
  flags,
  'targetType',
  'target type',
  schema.targetTypes,
  schema.targetTypes[0]
);
values.severity = await enumValue(flags, 'severity', 'severity', schema.severities);
values.status = await enumValue(
  flags,
  'status',
  'status',
  schema.statuses,
  schema.statuses.includes('wip') ? 'wip' : schema.statuses[0]
);
values.series = await optionalValue(flags, 'series', 'series');
values.cwe = await optionalList(flags, 'cwe', 'CWE list');
values.owasp = await optionalList(flags, 'owasp', 'OWASP list');
values.slug = await resolveSlug(flags, values.title);

if (rl) rl.close();

refuseIfExists(values.lang, values.slug);
const outPath = join(WRITEUPS_DIR, values.lang, `${values.slug}.mdx`);
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
console.log('Next      fill the seven sections, then flip visibility.draft to false.');
console.log(
  '          Sections 05 (dead ends) and 06 (the fix) are mandatory — plan/04-features.md F-02.'
);
