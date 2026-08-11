import type { Language } from '../i18n/ui';

export type CaseStatus = 'patched' | 'lab-only' | 'disclosed' | 'wip';

export interface FeaturedCase {
  /** Sequential case number shown in the card header. */
  number: number;
  /** Category code (WEB / IOT / …) — technical, kept English. */
  category: string;
  status: CaseStatus;
  title: Record<Language, string>;
  cwe?: string;
  owasp?: string;
  /** targetType label — technical, kept English. */
  targetType: string;
  readingMinutes: number;
  hasFix: boolean;
  /** Writeup URL. Empty until Phase 2 content collections exist. */
  href: string;
}

/**
 * Phase 1 seed data driving the "Selected case files" section.
 * TODO(copy): these titles mirror prototype/index.html; they are placeholders
 * until real writeups exist in Phase 2 — then the homepage reads content.
 * TODO(copy): `href` will point to the generated writeup pages.
 */
export const featuredCases: FeaturedCase[] = [
  {
    number: 14,
    category: 'WEB',
    status: 'patched',
    title: {
      en: 'The invoice endpoint that trusted a number',
      ar: 'الـ endpoint اللي وثق في رقم جاي من المستخدم',
    },
    cwe: '639',
    owasp: 'A01:2021',
    targetType: 'own-system',
    readingMinutes: 8,
    hasFix: true,
    href: '',
  },
  {
    number: 13,
    category: 'IOT',
    status: 'lab-only',
    title: {
      en: 'Spoofing an ESP32 telemetry stream in 40 lines',
      ar: 'انتحال بث ESP32 للقياسات في 40 سطر',
    },
    cwe: '345',
    targetType: 'own-system',
    readingMinutes: 11,
    hasFix: true,
    href: '',
  },
  {
    number: 12,
    category: 'WEB',
    status: 'disclosed',
    title: {
      en: 'Magic bytes are not a file upload policy',
      ar: 'الـ magic bytes مش سياسة رفع ملفات',
    },
    cwe: '434',
    owasp: 'A04:2021',
    targetType: 'research',
    readingMinutes: 9,
    hasFix: true,
    href: '',
  },
];
