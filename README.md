# 0xMARO — Personal Security Blog & Portfolio

> **Positioning:** `- I build systems that work.` / `+ I break systems that work.`
> واحد بيبني production systems فعلاً، وبيوثّق إزاي بتتكسر وإزاي بتتصلح.

ده مش "قالب بلوج". ده **نظام محتوى + هوية + خطة تنفيذ على 6 مراحل**.
كل ملف تحت `plan/` مكتوب علشان تشتغل منه مباشرة (tasks + acceptance criteria).

---

## الملفات

| # | الملف | بيجاوب على إيه |
|---|-------|----------------|
| 01 | [`plan/01-strategy.md`](plan/01-strategy.md) | مين أنت، الجمهور، الـ positioning، سياسة اللغتين، نبرة الكتابة |
| 02 | [`plan/02-architecture.md`](plan/02-architecture.md) | الـ sitemap، الـ routes، الـ i18n، الـ content model، الـ frontmatter schema |
| 03 | [`plan/03-design-system.md`](plan/03-design-system.md) | الهوية البصرية كاملة: tokens, typography, layout, motion, RTL rules |
| 04 | [`plan/04-features.md`](plan/04-features.md) | مواصفات كل feature — بما فيها **نظام التحكم في الإظهار/الإخفاء** |
| 05 | [`plan/05-roadmap.md`](plan/05-roadmap.md) | **الخطة على 6 مراحل** بمهام قابلة للشطب ومعايير قبول |
| 06 | [`plan/06-content-backlog.md`](plan/06-content-backlog.md) | أول 18 مقال محدّدين بالاسم من إنجازاتك الحقيقية |
| 07 | [`plan/07-seo-and-growth.md`](plan/07-seo-and-growth.md) | SEO تقني، structured data، حلقة LinkedIn، RSS، Newsletter |
| 08 | [`plan/08-quality-bar.md`](plan/08-quality-bar.md) | Definition of Done: a11y، performance، **security headers A+** |

**Prototype:** [`prototype/index.html`](prototype/index.html) — افتحه في المتصفح.
ده مش الموقع النهائي، ده **إثبات للهوية البصرية**: الـ hero، الـ case file card، الـ arsenal، الـ timeline، وزرار AR/EN بيقلب الموقع RTL فعلاً.

---

## القرار المعماري في سطرين

**Astro 5+** (content collections + built-in i18n) → **MDX** للمقالات → **Pagefind** للبحث (بيدعم العربي والإنجليزي تلقائي بـ `lang` attribute) → **Cloudflare Pages / Vercel**.
مفيش CMS ومفيش database في المرحلة الأولى. Git هو الـ CMS. لو احتجت لوحة تحكم بعدين → Decap CMS فوق نفس الـ repo (مرحلة 6).

## قاعدة واحدة تحكم كل حاجة

> **أي حاجة على الموقع لازم تثبت شيء. لو مش بتثبت حاجة، تتشال.**

عدد الـ certificates مش بيثبت حاجة. **Root cause analysis مكتوب كويس** بيثبت كل حاجة.
