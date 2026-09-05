#!/usr/bin/env node
/**
 * Quarterly maintenance report — plan/05-roadmap.md Phase 6.
 *
 * The same review is asked for in three places and, until now, in three places
 * it was "remember to do this":
 *   - plan/05 Phase 6  — revisit old posts, update them or retire them
 *   - plan/08 §8.1     — review the pinned action SHAs every quarter
 *   - plan/08 §8.2     — put a reminder in the calendar a month before the
 *                        security.txt Expires date
 * A reminder in a human's calendar is a reminder a human forgets. This computes
 * the answers instead, and .github/workflows/maintenance.yml opens an issue
 * with them every quarter.
 *
 * It reads the repo only — no network, no tokens, no dependencies. It never
 * fails the run: it is a report, not a gate. Exit code is always 0 so a
 * scheduled job cannot start failing for reasons nobody acts on.
 *
 * Usage:  node scripts/maintenance-report.mjs [--json]
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const NOW = new Date();
const STALE_MONTHS = 6; // a post untouched this long is worth a second look
const EXPIRY_WARN_DAYS = 30; // plan/08 §8.2: warn a month out
const SHA_REVIEW_DAYS = 90; // plan/08 §8.1: quarterly

const days = (ms) => Math.round(ms / 86_400_000);
const walk = (dir, out = []) => {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.mdx?$/.test(name)) out.push(p);
  }
  return out;
};

/** Minimal frontmatter reader — the fields here are flat scalars. */
const frontmatter = (file) => {
  const src = readFileSync(file, 'utf8');
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*(.+)$/);
    if (kv) out[kv[1]] = kv[2].trim().replace(/^['"]|['"]$/g, '');
  }
  out.__draft = /^\s*draft:\s*true\s*$/m.test(m[1]);
  return out;
};

// ── 1. Content that has gone stale ─────────────────────────────────────────
const stale = [];
for (const file of [
  ...walk(join(ROOT, 'src/content/writeups')),
  ...walk(join(ROOT, 'src/content/notes')),
]) {
  const fm = frontmatter(file);
  if (!fm || fm.__draft) continue; // drafts are not published, so not stale
  const touched = new Date(fm.updatedAt || fm.publishedAt);
  if (Number.isNaN(touched.getTime())) continue;
  const age = days(NOW - touched);
  if (age > STALE_MONTHS * 30) {
    stale.push({
      file: file.replace(ROOT + '/', ''),
      lastTouched: touched.toISOString().slice(0, 10),
      days: age,
    });
  }
}
stale.sort((a, b) => b.days - a.days);

// ── 2. security.txt expiry (plan/08 §8.2) ──────────────────────────────────
let expiry = null;
const secTxt = join(ROOT, 'public/.well-known/security.txt');
if (existsSync(secTxt)) {
  const raw = readFileSync(secTxt, 'utf8');
  const line = raw.match(/^Expires:\s*(.+)$/m);
  if (line) {
    const when = new Date(line[1].trim());
    const left = days(when - NOW);
    expiry = {
      date: when.toISOString().slice(0, 10),
      daysLeft: left,
      due: left <= EXPIRY_WARN_DAYS,
      expired: left < 0,
    };
  }
  const contact = raw.match(/^Contact:\s*(.+)$/m);
  if (contact && /TODO\(copy\)/.test(contact[1])) {
    expiry = { ...(expiry ?? {}), contactMissing: true };
  }
}

// ── 3. Pinned action SHAs (plan/08 §8.1) ───────────────────────────────────
const pins = [];
const wfDir = join(ROOT, '.github/workflows');
if (existsSync(wfDir)) {
  for (const name of readdirSync(wfDir).filter((f) => /\.ya?ml$/.test(f))) {
    const src = readFileSync(join(wfDir, name), 'utf8');
    for (const m of src.matchAll(/uses:\s*([^@\s]+)@([0-9a-f]{40})\s*(?:#\s*(\S+))?/g)) {
      pins.push({
        workflow: name,
        action: m[1],
        sha: m[2],
        version: m[3] ?? '(no version comment)',
      });
    }
    for (const m of src.matchAll(/uses:\s*([^@\s]+)@(?![0-9a-f]{40})(\S+)/g)) {
      pins.push({ workflow: name, action: m[1], sha: null, version: m[2], unpinned: true });
    }
  }
}
const unpinned = pins.filter((p) => p.unpinned);

// ── Report ─────────────────────────────────────────────────────────────────
const report = { generated: NOW.toISOString().slice(0, 10), stale, expiry, pins, unpinned };

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

const L = [];
L.push(`Quarterly maintenance — ${report.generated}`, '');

L.push(`## Content to revisit (untouched > ${STALE_MONTHS} months)`);
if (stale.length === 0) L.push('- Nothing stale. Every published entry was touched recently.');
else
  for (const s of stale)
    L.push(`- \`${s.file}\` — last touched ${s.lastTouched} (${s.days} days ago)`);
L.push(
  '',
  'Update it and set `updatedAt`, or retire it. Live content ranks better and shows care (plan/08 §8.7).',
  ''
);

L.push('## security.txt');
if (!expiry) L.push('- No Expires line found — RFC 9116 requires one.');
else {
  if (expiry.expired)
    L.push(`- **EXPIRED** on ${expiry.date}. Reporters may treat the file as abandoned.`);
  else if (expiry.due)
    L.push(`- Expires ${expiry.date} — ${expiry.daysLeft} days left. Renew it now (plan/08 §8.2).`);
  else L.push(`- Expires ${expiry.date} (${expiry.daysLeft} days left). Nothing to do yet.`);
  if (expiry.contactMissing)
    L.push(
      '- **`Contact:` is still `TODO(copy)`** — the file cannot do its job without a real address the owner controls.'
    );
}
L.push('');

L.push('## Pinned action SHAs (plan/08 §8.1)');
if (unpinned.length > 0) {
  L.push(`- **${unpinned.length} action(s) not pinned to a full SHA** — supply-chain risk:`);
  for (const p of unpinned) L.push(`  - \`${p.workflow}\`: \`${p.action}@${p.version}\``);
} else {
  L.push(`- All ${pins.length} action references are pinned to full SHAs.`);
}
L.push(`- Review these against upstream releases (reviewed every ${SHA_REVIEW_DAYS} days):`);
// One line per distinct action+sha: the same action pinned in two jobs is one
// thing to review, not two.
const seen = new Set();
for (const p of pins.filter((x) => !x.unpinned)) {
  const key = `${p.action}@${p.sha}`;
  if (seen.has(key)) continue;
  seen.add(key);
  const where = [
    ...new Set(pins.filter((q) => `${q.action}@${q.sha}` === key).map((q) => q.workflow)),
  ];
  L.push(
    `  - \`${p.action}\` — ${p.version} (\`${p.sha.slice(0, 12)}…\`) in ${where.map((w) => `\`${w}\``).join(', ')}`
  );
}

console.log(L.join('\n'));
