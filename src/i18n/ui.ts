export const languages = {
  en: 'English',
  ar: 'العربية',
} as const;

export type Language = keyof typeof languages;

export const defaultLang: Language = 'en';

const en = {
  skip: 'Skip to content',
  'nav.primary': 'Primary navigation',
  'nav.writeups': 'Writeups',
  'nav.projects': 'Projects',
  'nav.arsenal': 'Arsenal',
  'nav.journey': 'Journey',
  'nav.notes': 'Notes',
  'nav.labs': 'Labs',
  'nav.uses': 'Uses',
  'nav.hire': 'Hire me',
  'lang.switch': 'Switch language',
  'lang.en': 'English',
  'lang.ar': 'العربية',
  'meta.home':
    'Application security, written by someone who ships the code. Every writeup ends with a fix.',
  'hero.file': '~/identity.txt',
  'hero.line1': 'I build systems that work.',
  'hero.line2.before': 'I ',
  'hero.line2.em': 'break',
  'hero.line2.after': ' systems that work.',
  'hero.sub':
    'Application security, written by someone who ships the code. Every writeup ends with a fix — in the language the bug was written in.',
  'cta.casefiles': 'Read the case files',
  'cta.journey': 'The route I took',
  'proof.verify': 'verify ↗',
  'proof.seeProjects': 'see projects ↗',
  'sec.cases.num': '§01',
  'sec.cases.title': 'Selected case files',
  'sec.cases.note':
    'Own systems first. If I built it, I can show you the root cause and the patch.',
  'case.id': 'CASE',
  'case.fix': 'fix ✓',
  'case.min': '{0} min',
  'status.patched': 'patched',
  'status.lab-only': 'lab only',
  'status.disclosed': 'disclosed',
  'status.wip': 'wip',
  'footer.security': '/.well-known/security.txt',
  'footer.rss': 'rss.xml',
  'footer.github': 'github',
  'footer.note': 'Blueprint & Breach',
} as const;

export type UIKey = keyof typeof en;

const ar: Record<UIKey, string> = {
  skip: 'تخطَّ إلى المحتوى',
  'nav.primary': 'التنقل الأساسي',
  'nav.writeups': 'التحليلات',
  'nav.projects': 'المشاريع',
  'nav.arsenal': 'الأدوات',
  'nav.journey': 'المسار',
  'nav.notes': 'ملاحظات',
  'nav.labs': 'المعامل',
  'nav.uses': 'استخداماتي',
  'nav.hire': 'اعمل معي',
  'lang.switch': 'بدّل اللغة',
  'lang.en': 'English',
  'lang.ar': 'العربية',
  'meta.home': 'أمن تطبيقات مكتوب بقلم واحد بيكتب الكود نفسه. كل تحليل بينتهي بإصلاح حقيقي.',
  'hero.file': '~/identity.txt',
  'hero.line1': 'بابني أنظمة شغّالة.',
  'hero.line2.before': 'وبكسر أنظمة ',
  'hero.line2.em': 'شغّالة',
  'hero.line2.after': '.',
  'hero.sub':
    'أمن تطبيقات مكتوب بقلم واحد بيكتب الكود نفسه. كل تحليل بينتهي بإصلاح حقيقي — بنفس اللغة اللي اتكتبت بيها الثغرة.',
  'cta.casefiles': 'اقرأ ملفات الحالات',
  'cta.journey': 'الطريق اللي مشيته',
  'proof.verify': 'تحقّق ↗',
  'proof.seeProjects': 'شوف المشاريع ↗',
  'sec.cases.num': '§01',
  'sec.cases.title': 'ملفات مختارة',
  'sec.cases.note': 'الأنظمة اللي بنيتها الأول. لو أنا بنيته، أقدر أوريك الجذر والإصلاح.',
  'case.id': 'CASE',
  'case.fix': 'fix ✓',
  'case.min': '{0} دقيقة',
  'status.patched': 'تم الإصلاح',
  'status.lab-only': 'معملي فقط',
  'status.disclosed': 'تم الإفصاح',
  'status.wip': 'قيد العمل',
  'footer.security': '/.well-known/security.txt',
  'footer.rss': 'rss.xml',
  'footer.github': 'github',
  'footer.note': 'مخطط واختراق',
};

export const ui = { en, ar } as const;
