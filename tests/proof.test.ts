import { describe, expect, it } from 'vitest';
import { gateOnProof, isRealProof, isTodo, surfaceJourney, type Journey } from '../src/lib/proof';

const station = (id: string, event: string, claim = '', proof = ''): Journey =>
  ({
    id,
    data: {
      event: { en: event, ar: event },
      learned: { en: '', ar: '' },
      claim,
      proof,
    },
  }) as unknown as Journey;

describe('isRealProof', () => {
  it('accepts only absolute http(s) URLs', () => {
    expect(isRealProof('https://tryhackme.com/p/x')).toBe(true);
    expect(isRealProof('/projects/gymos')).toBe(false);
    expect(isRealProof('TODO(proof)')).toBe(false);
    expect(isRealProof('')).toBe(false);
  });
});

describe('isTodo', () => {
  it('treats empty and the bare marker as placeholders', () => {
    expect(isTodo('')).toBe(true);
    expect(isTodo('TODO(copy)')).toBe(true);
    expect(isTodo('Real sentence.')).toBe(false);
  });
});

describe('gateOnProof', () => {
  it('holds back a claim without proof and lets narrative through', () => {
    const rows = [
      { id: 'a', claim: '#3 EG', proof: '' },
      { id: 'b', claim: '', proof: '' },
      { id: 'c', claim: '6th', proof: 'https://example.org/results' },
    ];
    const { shown, suppressed } = gateOnProof(
      rows,
      (r) => r.claim,
      (r) => r.proof
    );
    expect(shown.map((r) => r.id)).toEqual(['b', 'c']);
    expect(suppressed).toEqual([{ id: 'a', claim: '#3 EG' }]);
  });
});

describe('surfaceJourney', () => {
  it('never shows a station whose event is still TODO(copy)', () => {
    const { shown, suppressed } = surfaceJourney([
      station('written', 'Started the eCDFP track'),
      station('placeholder', 'TODO(copy): started something'),
    ]);
    expect(shown.map((s) => s.id)).toEqual(['written']);
    expect(suppressed.map((s) => s.id)).toEqual(['placeholder']);
  });

  it('still holds back an unproven claim', () => {
    const { shown } = surfaceJourney([station('ranked', 'Ranked', '#3 EG', 'TODO(proof)')]);
    expect(shown).toEqual([]);
  });
});
