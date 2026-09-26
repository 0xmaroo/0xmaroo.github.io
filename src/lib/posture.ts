import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Security posture, read from the repository at build time (plan/09 F-13).
 * Nothing here is typed by hand: /security renders what these functions find
 * in the workflows, security.txt, package.json and the test suite, so the
 * page is re-derived on every build and cannot drift from the code.
 */

const ROOT = process.cwd();
const read = (path: string): string => readFileSync(join(ROOT, path), 'utf8');

export interface PinnedAction {
  action: string;
  sha: string | null; // null → floating tag: a supply-chain finding
  version: string;
  workflows: string[];
}

/** Every `uses:` in .github/workflows, grouped by action@ref. */
export function pinnedActions(): PinnedAction[] {
  const dir = join(ROOT, '.github/workflows');
  if (!existsSync(dir)) return [];
  const byRef = new Map<string, PinnedAction>();
  for (const name of readdirSync(dir)
    .filter((f) => /\.ya?ml$/.test(f))
    .sort()) {
    const src = readFileSync(join(dir, name), 'utf8');
    for (const m of src.matchAll(/uses:\s*([^@\s]+)@(\S+)(?:\s*#\s*(\S+))?/g)) {
      const [, action, ref, comment] = m;
      const pinned = /^[0-9a-f]{40}$/.test(ref);
      const key = `${action}@${ref}`;
      const entry = byRef.get(key) ?? {
        action,
        sha: pinned ? ref : null,
        version: pinned ? (comment ?? '—') : ref,
        workflows: [],
      };
      if (!entry.workflows.includes(name)) entry.workflows.push(name);
      byRef.set(key, entry);
    }
  }
  return [...byRef.values()].sort((a, b) => a.action.localeCompare(b.action));
}

export interface SecurityTxt {
  contact: string;
  expires: Date | null;
  daysLeft: number | null;
}

/** RFC 9116 fields from public/.well-known/security.txt, with days to expiry. */
export function securityTxt(now = new Date()): SecurityTxt {
  const raw = read('public/.well-known/security.txt');
  const field = (name: string) => raw.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'))?.[1].trim();
  const expiresRaw = field('Expires');
  const expires = expiresRaw ? new Date(expiresRaw) : null;
  const daysLeft =
    expires && !Number.isNaN(expires.getTime())
      ? Math.floor((expires.getTime() - now.getTime()) / 86_400_000)
      : null;
  return { contact: field('Contact') ?? '', expires, daysLeft };
}

/** Known gates → the i18n key that explains them and the file behind them. */
const GATE_INFO: { match: RegExp; key: GateKey; source?: string }[] = [
  { match: /^npm test$/, key: 'tests', source: 'tests' },
  { match: /^astro build$/, key: 'build' },
  { match: /check-copy\.mjs/, key: 'copy', source: 'scripts/check-copy.mjs' },
  { match: /check-links\.mjs/, key: 'links', source: 'scripts/check-links.mjs' },
  { match: /^pagefind\b/, key: 'pagefind' },
  { match: /check-pagefind\.sh/, key: 'index', source: 'scripts/check-pagefind.sh' },
];

export type GateKey = 'tests' | 'build' | 'copy' | 'links' | 'pagefind' | 'index';

export interface Gate {
  command: string;
  key: GateKey | null;
  source?: string;
}

/**
 * The commands a deploy must pass, in order: the unit tests the deploy
 * workflow runs first (when it does), then every step of `npm run build`.
 */
export function deployGates(): Gate[] {
  const build: string = JSON.parse(read('package.json')).scripts.build;
  const commands = build.split('&&').map((c) => c.trim());
  if (/run:\s*npm test\b/.test(read('.github/workflows/deploy.yml'))) commands.unshift('npm test');
  return commands.map((command) => {
    const info = GATE_INFO.find((g) => g.match.test(command));
    return { command, key: info?.key ?? null, source: info?.source };
  });
}

/** Test cases in tests/*.test.ts — counted from the source, not asserted. */
export function testCount(): number {
  const dir = join(ROOT, 'tests');
  if (!existsSync(dir)) return 0;
  return readdirSync(dir)
    .filter((f) => f.endsWith('.test.ts'))
    .reduce((n, f) => n + (read(`tests/${f}`).match(/^\s*it\(/gm)?.length ?? 0), 0);
}
