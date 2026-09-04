#!/usr/bin/env node
// Fail the build if placeholder copy (TODO(copy)) ships to an indexable page.
//
// Placeholder scaffolding is allowed to exist while authoring, but an
// indexable page made of placeholders (an empty published article, an About
// page whose meta description is literally TODO(copy)) must never deploy.
// This is the copy-side sibling of scripts/check-pagefind.sh.
//
// Two conditions, reported separately:
//   1. a collection entry that builds in production (not `draft`) whose BODY
//      still contains TODO(copy) — reported by source file path;
//   2. a built HTML page under dist/ that contains TODO(copy) and is NOT
//      marked <meta name="robots" content="noindex..."> — reported by built
//      page path. This is what catches the About pages, whose prose comes
//      from src/i18n/ui.ts rather than a collection body.
//
// ONE escape hatch, and only one: ALLOW_TODO_COPY=1 downgrades the failure to
// a loud warning that still lists every offender. It exists so local
// authoring and the remaining Phase 4 work can build. It is NOT set in
// .github/workflows/deploy.yml and must NEVER be added there — deploys stay
// protected.
//
// On a clean repo this is quiet and fast: one summary line, exit 0.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const MARKER = 'TODO(copy)';
const ESCAPED = process.env.ALLOW_TODO_COPY === '1';

function walk(dir, filter) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full, filter));
    else if (filter.test(name)) out.push(full);
  }
  return out;
}

// ── Condition 1: collection entries that build, with placeholder bodies ──
// Draft detection mirrors the schema default: `visibility.draft` defaults to
// true, so only an explicit `draft: false` counts as building in production.

const isBuilt = (fm) => Boolean(fm) && /^\s*draft:\s*false\s*$/m.test(fm[1]);

function collectionFiles() {
  return walk(join(ROOT, 'src', 'content'), /\.(mdx|md)$/);
}

function offendingEntries() {
  return collectionFiles()
    .filter((file) => {
      const source = readFileSync(file, 'utf8');
      const fm = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!isBuilt(fm)) return false; // draft → never in the production output
      return source.slice(fm[0].length).includes(MARKER);
    })
    .map((file) => relative(ROOT, file));
}

// ── Condition 2: indexable built pages containing placeholder copy ──

function isNoindex(html) {
  const tag = html.match(/<meta\s[^>]*name=["']robots["'][^>]*>/i);
  return Boolean(tag && tag[0].includes('noindex'));
}

function offendingPages() {
  return walk(join(ROOT, 'dist'), /\.html$/)
    .filter((file) => {
      const html = readFileSync(file, 'utf8');
      return html.includes(MARKER) && !isNoindex(html);
    })
    .map((file) => relative(ROOT, file));
}

// ── Report ──

if (!statSync(join(ROOT, 'dist'), { throwIfNoEntry: false })) {
  console.error('ERROR: dist/ missing — did astro build run before check-copy?');
  process.exit(1);
}

const entries = offendingEntries();
const pages = offendingPages();
const failed = entries.length > 0 || pages.length > 0;

if (failed) {
  const stream = ESCAPED ? console.log : console.error;
  const label = ESCAPED ? 'WARNING' : 'ERROR';
  stream(`${label}: placeholder copy (${MARKER}) reached the build:`);
  if (entries.length > 0) {
    stream('');
    stream('entries that build in production, body still TODO(copy):');
    for (const e of entries) stream(`  - ${e}`);
  }
  if (pages.length > 0) {
    stream('');
    stream('indexable built pages containing TODO(copy):');
    for (const p of pages) stream(`  - ${p}`);
  }
  if (ESCAPED) {
    stream('');
    stream(
      `check-copy: ALLOW_TODO_COPY=1 — ${entries.length} entry and ${pages.length} page offender(s) downgraded to warning`
    );
  } else {
    process.exit(1);
  }
} else {
  const checkedEntries = collectionFiles().length;
  const checkedPages = walk(join(ROOT, 'dist'), /\.html$/).length;
  console.log(`check-copy: ${checkedEntries} entries and ${checkedPages} pages clean`);
}
