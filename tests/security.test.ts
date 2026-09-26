import { describe, expect, it } from 'vitest';
import { csp } from '../src/config/security';
import { deployGates, pinnedActions, securityTxt, testCount } from '../src/lib/posture';

describe('CSP (src/config/security.ts)', () => {
  it('stays self-only: no inline, no eval, no third-party origin', () => {
    expect(csp).not.toMatch(/unsafe-inline|unsafe-eval|https?:|\*/);
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("object-src 'none'");
  });
});

describe('posture — what /security renders', () => {
  it('finds every action pinned to a full SHA', () => {
    const actions = pinnedActions();
    expect(actions.length).toBeGreaterThan(0);
    expect(actions.filter((a) => a.sha === null)).toEqual([]);
  });

  it('lists the unit tests as the first deploy gate', () => {
    const gates = deployGates();
    expect(gates[0].command).toBe('npm test');
    expect(gates.map((g) => g.key)).toContain('links');
  });

  it('reads a real contact and a future expiry from security.txt', () => {
    const txt = securityTxt(new Date('2026-09-26'));
    expect(txt.contact).toMatch(/^mailto:.+@.+/);
    expect(txt.daysLeft).toBeGreaterThan(0);
  });

  it('counts test cases from the source', () => {
    expect(testCount()).toBeGreaterThan(20);
  });
});
