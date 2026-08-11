import type { Language } from '../i18n/ui';

export interface ProofItem {
  /** The headline figure, e.g. "#3 EG". Western digits only (plan/03-design-system.md §3.2 rule 4). */
  value: string;
  /** Verification URL. Empty means the item is NOT rendered (plan/04-features.md F-11). */
  href: string;
  label: Record<Language, string>;
  /** Which i18n key to use for the "verify" affordance. */
  verifyKey: 'proof.verify' | 'proof.seeProjects';
}

/**
 * Proof strip data. Every figure must link to a verifiable source before it
 * is shown. Until `href` is filled the StatStrip skips the item.
 *
 * TODO(proof): fill the three URLs below:
 *  - TryHackMe public profile
 *  - CAT Reloaded CTF official results
 *  - projects section (real after Phase 3)
 */
export const proofItems: ProofItem[] = [
  {
    value: '#3 EG',
    href: '',
    label: {
      en: 'TryHackMe · Cyber Security 101',
      ar: 'TryHackMe · مسار Cyber Security 101',
    },
    verifyKey: 'proof.verify',
  },
  {
    value: '6th / 200+',
    href: '',
    label: {
      en: 'CAT Reloaded CTF · team liel0x1',
      ar: 'مسابقة CAT Reloaded · فريق liel0x1',
    },
    verifyKey: 'proof.verify',
  },
  {
    value: '3 live',
    href: '',
    label: {
      en: 'Production systems I built & maintain',
      ar: 'أنظمة production بنيتها وبشتغل عليها',
    },
    verifyKey: 'proof.seeProjects',
  },
];
