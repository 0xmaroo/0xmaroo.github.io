#!/usr/bin/env node
// Fail the build on a dead internal link (plan/09 §9.4).
//
// lychee runs in CI, but only on pull requests. This runs inside
// `npm run build`, so a dead link cannot reach a deploy either. It caught its
// reason to exist by hand first: /arsenal linked to writeups that had gone
// back to draft.
//
// Checked: every root-relative href/src on a real tag (<a>, <link>, <script>,
// <img>, <source>) resolves to a file in dist/, and every same-page `#id`
// fragment names an element on that page. Only real attributes inside an
// opening tag are matched — code blocks that QUOTE an href are text.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = join(process.cwd(), 'dist');

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : full.endsWith('.html') ? [full] : [];
  });
}

/** A root-relative URL path resolves the way GitHub Pages serves it. */
function resolves(path) {
  const clean = decodeURI(path).replace(/\/+$/, '');
  const target = join(DIST, clean);
  if (existsSync(target) && statSync(target).isFile()) return true;
  return existsSync(join(target, 'index.html')) || existsSync(`${target}.html`);
}

const ATTR = /<(?:a|link|script|img|source)\s[^>]*?\b(?:href|src)="([^"]*)"/g;
const failures = [];
const pages = walk(DIST);

for (const file of pages) {
  const html = readFileSync(file, 'utf8');
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  for (const [, url] of html.matchAll(ATTR)) {
    if (url.startsWith('#')) {
      if (url.length > 1 && !ids.has(decodeURIComponent(url.slice(1)))) {
        failures.push(`${relative(DIST, file)} → ${url} (no such id on the page)`);
      }
      continue;
    }
    if (!url.startsWith('/') || url.startsWith('//')) continue; // external or protocol-relative
    const path = url.split(/[?#]/)[0];
    if (!resolves(path)) failures.push(`${relative(DIST, file)} → ${url}`);
  }
}

if (failures.length > 0) {
  console.error(`ERROR: ${failures.length} dead internal link(s):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`check-links: ${pages.length} pages, every internal link resolves`);
