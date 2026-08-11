# 02 — المعمارية والـ Content Model

## 2.1 الـ Stack والقرار

| الطبقة | الاختيار | ليه ده بالذات |
|--------|----------|----------------|
| Framework | **Astro 5+** | Zero JS افتراضياً، Content Collections بـ type-safety عبر Zod، وi18n routing مدمج من 4.0 |
| المحتوى | **MDX** | Markdown + components (Callout, Payload, Diff, Terminal) جوه المقال |
| الستايل | **CSS custom properties + طبقة utilities صغيرة** | مش Tailwind. السبب: الهوية دي قايمة على tokens ودقة spacing وRTL logical properties — الـ utility classes هتخليك تكرر نفس الديزاين اللي بنهرب منه |
| البحث | **Pagefind** | بيبني index بعد الـ build، وبيعمل index منفصل لكل لغة تلقائياً من `<html lang>` — يعني العربي والإنجليزي شغالين من غير أي كونفيج |
| Syntax highlighting | **Shiki** (مدمج في Astro) | بيتلوّن وقت الـ build → صفر JS |
| Hosting | **GitHub Pages** (repo: `0xmaroo.github.io`) | مجاني، deploy عن طريق Actions. **ما بيسمحش بأي headers** — CSP وReferrer-Policy عن طريق `<meta>` (شوف §8.1) |
| Analytics | **Umami** (self-hosted أو cloud) أو **Cloudflare Web Analytics** | بدون كوكيز. موقع أمن معلومات فيه Google Analytics = تناقض |
| التعليقات | **Giscus** (GitHub Discussions) — مرحلة 5 | مفيش database، والجمهور بتاعك أصلاً على GitHub |

> ليه مش Next.js؟ لأنك مش محتاج server. كل المحتوى static. Next.js هيديك تعقيد runtime مقابل صفر فايدة هنا. لو احتجت dashboard حقيقي بعدين، هتضيفه كتطبيق منفصل على subdomain.

## 2.2 الـ Sitemap

```
/                          الصفحة الرئيسية — الـ diff hero + آخر 3 مقالات + proof strip
/writeups                  الأرشيف الكامل + فلاتر (category, tag, difficulty, status)
/writeups/[slug]           المقال
/notes                     ملاحظات قصيرة + ملخصات كتب ومقالات (stream)
/notes/[slug]
/projects                  الـ portfolio
/projects/[slug]           Case study كامل
/labs                      TryHackMe / HTB / CTF — جدول + تايم لاين تقدّم
/arsenal                   الأدوات كـ قدرات، مش أيقونات
/journey                   التايم لاين + الشهادات + الترتيبات
/about                     القصة التقنية
/uses                      السيت-أب (جهاز، VM، إضافات Burp، dotfiles) — بيجيب ترافيك أكتر مما تتخيل
/search                    صفحة بحث كاملة (Pagefind)
/rss.xml  /rss-ar.xml      فيدات منفصلة لكل لغة
/sitemap-index.xml
/.well-known/security.txt  RFC 9116 — إثبات إنك بتمشي بالمعايير
/humans.txt
/404
```

**URLs باللغتين:** الافتراضي إنجليزي بدون بادئة، والعربي بـ `/ar/`:
```
/writeups/idor-in-invoice-api        →  الإنجليزي
/ar/writeups/idor-in-invoice-api     →  العربي (نفس الـ slug — أسهل في الصيانة وفي hreflang)
```
استخدم `getRelativeLocaleUrl()` من `astro:i18n` في كل لينك داخلي. **ما تكتبش لينك يدوي أبداً** — أول حاجة هتكسر في الـ i18n.

## 2.3 تنظيم المحتوى على الديسك

```
src/content/
├── writeups/
│   ├── en/idor-in-invoice-api.mdx
│   └── ar/idor-in-invoice-api.mdx      ← اختياري
├── notes/
│   ├── en/...
│   └── ar/...
├── projects/
│   ├── en/gymos.mdx
│   └── ar/gymos.mdx                     ← إلزامي للاتنين
├── labs/            (YAML/JSON data — مش مقالات)
└── timeline/        (YAML)
```

قاعدة: **folder لكل لغة**. أسهل بكتير في المتابعة من `post.ar.mdx` لما يبقى عندك 60 ملف.

## 2.4 الـ Frontmatter Schema (ده قلب النظام)

`src/content/config.ts` — كل حقل هنا موجود لسبب:

```ts
import { defineCollection, z } from 'astro:content';

const visibility = z.object({
  draft:      z.boolean().default(true),   // مش هيتبني خالص في production
  unlisted:   z.boolean().default(false),  // له لينك، بس مش في الأرشيف ولا الـ RSS ولا الـ sitemap
  featured:   z.boolean().default(false),  // يظهر في الهوم
  noindex:    z.boolean().default(false),  // meta robots noindex
  hideFrom:   z.array(z.enum(['home','archive','rss','search','sitemap','related']))
                .default([]),              // تحكم دقيق: يظهر فين ويختفي فين
});

const writeups = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    title: z.string().max(70),
    summary: z.string().min(80).max(200),      // بيتستخدم في الـ meta وفي الكارت
    lang: z.enum(['en','ar']),
    translationOf: z.string().optional(),       // slug النسخة التانية
    publishedAt: z.date(),
    updatedAt: z.date().optional(),

    // التصنيف
    category: z.enum(['web','network','forensics','reversing','cloud','mobile','misc']),
    tags: z.array(z.string()).max(8),
    series: z.string().optional(),              // لربط سلسلة مقالات
    seriesOrder: z.number().optional(),

    // الحقول اللي بتفرّقك عن أي بلوج تاني
    target: z.string(),                         // "GymOS v1.2 — self-built" / "HTB: Cascade"
    targetType: z.enum(['own-system','ctf','lab','public-program','research']),
    cwe: z.array(z.string()).default([]),       // ['CWE-639','CWE-284']
    owasp: z.array(z.string()).default([]),     // ['A01:2021']
    severity: z.enum(['info','low','medium','high','critical']).optional(),
    status: z.enum(['patched','disclosed','lab-only','wip']),
    hasFix: z.boolean().default(false),         // فيه كود إصلاح فعلي؟
    toolsUsed: z.array(z.string()).default([]),
    readingTime: z.number().optional(),         // بيتحسب أوتوماتيك

    cover: image().optional(),
    visibility: visibility.default({}),
  }),
});
```

**ليه `target` و`targetType` مهمين جداً:**
بيخلوا الموقع يقدر يقول بصدق: "دي ثغرة في نظام أنا بنيته" مقابل "دي machine محلولة". دي **أمانة**، والأمانة دي بالظبط اللي بتبني السمعة. وكمان بتديك فلتر قوي في الأرشيف.

`projects` collection بيزود: `role` (دورك بالظبط في المشروع), `status` (live/archived/private), `stack`, `metrics` (مستخدمين/سجلات/uptime), `repo`, `demo`, `securityNotes`.
`notes` collection أبسط: `kind: z.enum(['note','book-summary','paper-summary','til'])` + `source` (اسم الكتاب/المقال ولينكه).

## 2.5 حساب "إيه اللي يتعرض" — طبقة واحدة مركزية

اعمل `src/lib/content.ts` وحط فيه **كل** فلترة، وما تفلترش في أي صفحة تانية:

```ts
export const isPublic = (e) =>
  !e.data.visibility.draft &&
  !(import.meta.env.PROD && e.data.visibility.draft);

export const forSurface = (entries, surface, lang) =>
  entries
    .filter(isPublic)
    .filter(e => e.data.lang === lang)
    .filter(e => !e.data.visibility.unlisted || surface === 'direct')
    .filter(e => !e.data.visibility.hideFrom.includes(surface))
    .sort((a,b) => b.data.publishedAt - a.data.publishedAt);
```

كده لما تقرر تخفي مقال، بتغيّر سطر واحد في الـ frontmatter وبيختفي من الأرشيف والـ RSS والبحث والـ sitemap **مع بعض**. من غير الطبقة دي هتنسى مكان وتسرّب مسودة.

## 2.6 شجرة المشروع

```
0xmaroo/
├── src/
│   ├── components/
│   │   ├── hero/DiffHero.astro          ← التوقيع البصري
│   │   ├── cards/CaseFileCard.astro
│   │   ├── writeup/{Toc,Progress,Callout,Payload,FixDiff,DeadEnd}.astro
│   │   ├── nav/{Header,LangSwitch,CommandPalette}.astro
│   │   └── proof/{StatStrip,CtfTable,CertGrid}.astro
│   ├── layouts/{Base,Writeup,Project}.astro
│   ├── i18n/{ui.ts,utils.ts}            ← قاموس الواجهة
│   ├── lib/{content.ts,seo.ts,reading-time.ts}
│   ├── styles/{tokens.css,base.css,typography.css,rtl.css}
│   ├── content/
│   └── pages/
│       ├── index.astro ...              ← الإنجليزي
│       └── ar/...                       ← العربي
├── public/{fonts/, .well-known/security.txt, humans.txt}
├── .nojekyll                            ← إجباري على GitHub Pages (من غيره `_astro/` بيتبتر)
└── astro.config.mjs
```

## 2.7 كونفيج الـ i18n

```js
// astro.config.mjs
i18n: {
  defaultLocale: 'en',
  locales: ['en','ar'],
  routing: { prefixDefaultLocale: false, redirectToDefaultLocale: true },
},
```
و`src/i18n/ui.ts` فيه dictionary مسطّح لكل نصوص الواجهة. **قاعدة:** أي نص إنجليزي مكتوب داخل component = bug. كله من الـ dictionary.
