# AGENT-KICKOFF.md — الرسايل اللي تبعتها للـ AI اللي هينفّذ

**إزاي تستخدم الملف ده:**
1. حط `CLAUDE.md` في جذر الـ repo (مهم — الأداة بتقراه لوحدها كل جلسة).
2. ابعت **رسالة واحدة بس في كل مرة**، بالترتيب. ما تبعتش المراحل كلها مرة واحدة — هتاخد شغل سريع ورخيص.
3. بعد كل مرحلة: شغّل الموقع، بص بعينك، وابعت الملاحظات قبل ما تروح للي بعدها.

> قاعدة ذهبية: أي وكيل AI بيبقى كويس على قد ما الـ **acceptance criteria** واضحة. كل رسالة تحت فيها معايير قبول — سيبها زي ما هي.

---

## 0 · رسالة البداية (ابعتها أول مرة بس)

```
You are the lead engineer on 0xmaro.dev — a bilingual (EN/AR) security blog and portfolio.

Before writing any code:
1. Read CLAUDE.md at the repo root. It contains hard rules. Treat them as compile errors.
2. Read plan/01-strategy.md, plan/02-architecture.md, plan/03-design-system.md,
   plan/04-features.md, plan/05-roadmap.md.
3. Open prototype/index.html — this is the approved visual direction ("Blueprint & Breach").
   It is a static mock, not production code. Do not copy its markup. Extract the design
   language from it: the colour roles, the mono display type, the diff hero, the case-file
   card with the rotated status stamp, the ruler-style rail, the blueprint grid background.

Then, before touching anything, reply with:
- A 10-line summary of what you understood the site to be and who it is for.
- Any place where the plan is internally inconsistent, technically wrong, or where you would
  make a different call — with your reasoning. I want disagreement here, not agreement.
- Your file-by-file plan for Phase 0 and Phase 1 only.

Do not write code in this first reply.
```

**ليه الرسالة دي مهمة:** لو الوكيل قال "تمام، ممتاز، هبدأ" من غير ما يعترض على أي حاجة — ده مؤشر إنه ما قراش الملفات. اطلب منه يعيد.

---

## 1 · المرحلة 0+1 — الأساس والهوية البصرية

```
Implement Phase 0 and Phase 1 from plan/05-roadmap.md.

Scope:
- Astro 5 project, TypeScript strict, integrations: mdx, sitemap, rss, sharp.
- src/styles/tokens.css with every token from plan/03-design-system.md §3.1 and §3.2, verbatim.
- base.css, typography.css (fluid scale, the five Arabic rules), rtl.css.
- Self-hosted IBM Plex Sans / Sans Arabic / Mono / Sans Condensed as woff2, subset,
  preload the body face only. Arabic subset must include U+0600-06FF, U+0750-077F,
  U+FB50-FDFF, U+FE70-FEFF plus Latin punctuation and digits.
- layouts/Base.astro: head, skip link, landmarks, blueprint grid background in pure CSS.
- components: Header, Footer, LangSwitch, DiffHero, CaseFileCard, Rail (ruler progress).
- The DiffHero animation plays once per session (sessionStorage), total under 1200ms,
  and both lines appear instantly under prefers-reduced-motion.
- LangSwitch must keep the user on the same page when switching language, never send them home.

Acceptance criteria — verify each one and report the result:
[ ] Zero physical CSS directions in the whole codebase (grep for "left:", "right:", "margin-left").
[ ] Zero hardcoded hex colours outside tokens.css.
[ ] Homepage renders correctly at 360px, 768px and 1440px, in both LTR and RTL.
[ ] Keyboard-only pass: every interactive element reachable with a visible focus ring.
[ ] Lighthouse >= 95 on all four categories.
[ ] npm run build produces no warnings.

Show me the diff of tokens.css and DiffHero.astro before committing the rest.
```

---

## 2 · المرحلة 2 — نظام المحتوى والنشر

```
Implement Phase 2 from plan/05-roadmap.md.

- src/content/config.ts with the exact Zod schema from plan/02-architecture.md §2.4,
  including the `visibility` object.
- src/lib/content.ts exporting forSurface(entries, surface, lang). Every page must read
  through it. No page filters entries itself.
- i18n: astro.config i18n block, src/i18n/ui.ts dictionary, getRelativeLocaleUrl everywhere.
- layouts/Writeup.astro: sticky TOC in the rail, reading time, translation link, JSON-LD TechArticle.
- MDX components: Payload (copy button, dir=ltr, "sanitized" badge), FixDiff (before/after),
  DeadEnd, Callout (note|warn|legal), Terminal.
- Pages in both locales: /, /writeups, /writeups/[slug], /about, /404.
- Shiki theme derived from our tokens: sulfur for strings and highlights, blue for keywords.
- /rss.xml and /rss-ar.xml as separate feeds, sitemap, robots.txt, hreflang + canonical on
  every page.
- Seed three MDX writeups with TODO(copy) bodies but complete, realistic frontmatter.

Acceptance criteria — prove each one with a command or a file path:
[ ] A post with draft: true produces no file in dist/.
[ ] A post with unlisted: true opens by URL but is absent from RSS, sitemap and the archive,
    and carries meta robots noindex.
[ ] Setting hideFrom: ['home'] removes it from the homepage only.
[ ] An Arabic writeup page has <html lang="ar" dir="rtl"> and its code blocks are dir="ltr".
[ ] Mixed Arabic + technical terms (e.g. "ثغرة SQL Injection في CVE-2021-44228") render in the
    correct order.
[ ] Lighthouse 100 on an article page.
```

---

## 3 · المرحلة 3 — طبقة الإثبات

```
Implement Phase 3 from plan/05-roadmap.md: /projects, /projects/[slug], /labs, /journey,
/arsenal, and the StatStrip on the homepage.

Rules specific to this phase:
- Every claim, rank, certificate and metric must carry a `proof` URL in its data file.
  If a data entry has no proof URL, do not render it — and list it for me instead.
- Projects require a `role` field describing exactly what I did. Never write it yourself:
  leave TODO(copy) and ask me.
- /arsenal is a capability table (Domain / Tools / Used on), never an icon grid.
- Auto-generate a 1200x630 OG image per entry at build time using the blueprint background,
  the title, the CASE number and the CWE.

Acceptance: every number on the site is clickable to a verifiable source, or it is not on the site.
```

---

## 4 · المرحلة 4 — البحث والجودة

```
Implement Phase 4: Pagefind indexing in the build, /search, a ⌘K command palette,
archive filters via query params that work with JavaScript disabled, related posts matched by
CWE, series support, and the meta CSP / Referrer-Policy from plan/08-quality-bar.md §8.1 plus
/.well-known/security.txt.

Acceptance criteria:
[ ] Searching an Arabic term returns Arabic results only; an English term returns English only.
[ ] The archive filters work with JS disabled and the filter state lives in the URL.
[ ] CSP via `<meta>` on live pages with no unsafe-inline on script-src (HSTS/X-Frame-Options/
    X-Content-Type-Options/Permissions-Policy/COOP/CORP are impossible on GitHub Pages — see plan/08 §8.1).
[ ] Lighthouse 100/100/100/100 on three different page types.
[ ] Screen reader pass on one Arabic and one English page — report what you heard.
```

---

## 5 · رسايل قصيرة تستخدمها في أي وقت

**مراجعة نقدية (استخدمها كل مرحلة):**
```
Review the code you just wrote as a hostile senior reviewer who did not write it. Find the
three weakest decisions, the places that will break first, and anything that violates CLAUDE.md.
Do not fix anything yet — list the findings with file:line first.
```

**لما الديزاين يطلع "عادي":**
```
This looks like a generic dark developer template. Go back to plan/03-design-system.md and tell
me which specific decisions from the spec are missing in the implementation — spacing rhythm,
type scale, the stamp treatment, the rail, the blueprint grid density — then fix only those.
```

**قبل أي نشر:**
```
Run the pre-publish checklist in plan/08-quality-bar.md §8.6 and report pass/fail per item.
Do not mark anything as passed that you did not actually verify.
```

**لما تضيف feature جديدة:**
```
Before implementing: what does this cost in client JS, and does it break RTL or reduced-motion?
If either answer is bad, propose a lighter alternative first.
```

---

## 6 · حاجات ما تسيبهاش للـ AI أبداً

| الحاجة | ليه |
|--------|-----|
| نصوص الـ About والمشاريع | ده صوتك أنت. أي AI هيكتب "passionate" و"cutting-edge" وهتموت الهوية |
| أي رقم أو شهادة أو ترتيب | خطر مصداقية حقيقي — دي بتتحقق |
| محتوى الـ writeups التقني | لو مش أنت اللي فهمت الثغرة، هتتكشف في أول سؤال في interview |
| قرار نشر ثغرة في نظام عميل | قرار قانوني وأخلاقي، مش تقني |

الـ AI ينفّذ الديزاين والبنية والكود. **المحتوى والحكم منك.** ده بالظبط اللي بيخلي الموقع بتاعك مش قابل للتقليد.
