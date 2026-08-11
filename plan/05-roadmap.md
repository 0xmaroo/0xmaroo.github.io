# 05 — خطة التنفيذ · 6 مراحل

**فلسفة الخطة:** المراحل مترتبة علشان الموقع يبقى **قابل للنشر من نهاية المرحلة 2**. أي مرحلة بعد كده بتزوّد قيمة، مش بتفكّ حاجة.
التقديرات بالساعات لواحد شغال لوحده وعارف الـ stack.

---

## المرحلة 0 — الأساس (≈ 4 ساعات)

- [ ] احجز الدومين `0xmaro.dev` + فعّل إيميل `me@` و`security@`
- [ ] `npm create astro@latest` → قالب minimal + TypeScript strict
- [ ] ضيف: `@astrojs/mdx`, `@astrojs/sitemap`, `@astrojs/rss`, `pagefind`, `sharp`
- [ ] Repo على GitHub (private في البداية) + Cloudflare Pages متوصل بالـ `main`
- [ ] `.editorconfig` + Prettier + ESLint + Conventional Commits
- [ ] نزّل خطوط IBM Plex (Sans / Sans Arabic / Mono / Sans Condensed) وحوّلها woff2 + subset، وحطها في `public/fonts`

**معيار القبول:** push على `main` → deploy تلقائي على URL شغال.

---

## المرحلة 1 — الهوية والنظام البصري (≈ 12 ساعة)

- [ ] `src/styles/tokens.css` — كل الـ tokens من `03-design-system.md` بالظبط
- [ ] `base.css` + `typography.css` (المقياس السلس + قواعد العربي الخمسة)
- [ ] `rtl.css` — قواعد logical properties + منع `letter-spacing` و`uppercase` على العربي
- [ ] `layouts/Base.astro` — head، خطوط، skip link، landmarks
- [ ] `Header` + `Footer` + `LangSwitch` (بيحافظ على نفس الصفحة عند التبديل، مش بيرجّع للهوم)
- [ ] **DiffHero** — التوقيع البصري، بالأنيميشن + `prefers-reduced-motion` + `sessionStorage`
- [ ] `CaseFileCard` بالختم المايل
- [ ] شبكة البلوبرنت الخلفية (CSS gradients، **مش صورة**)
- [ ] الـ Rail بمؤشر التقدم شكل مسطرة قياس
- [ ] اختبار على موبايل حقيقي (مش DevTools بس)

**معيار القبول:** لو حطيت الهوم بتاعتك جنب 5 بورتفوليوهات أمن معلومات تانية، الفرق يبان في أقل من ثانيتين. Lighthouse ≥ 95 من دلوقتي.

---

## المرحلة 2 — نظام المحتوى + أول نشر (≈ 14 ساعة)

- [ ] `src/content/config.ts` بالـ schema الكامل (شامل `visibility`)
- [ ] `src/lib/content.ts` — `forSurface()` وكل الفلترة في مكان واحد
- [ ] i18n: كونفيج + `ui.ts` dictionary + `getRelativeLocaleUrl` في كل اللينكات
- [ ] `layouts/Writeup.astro` — TOC، وقت القراءة، meta، لينك الترجمة
- [ ] مكونات MDX: `Payload`, `FixDiff`, `DeadEnd`, `Callout`, `Terminal`
- [ ] الصفحات: `/`, `/writeups`, `/writeups/[slug]`, `/about`, `/404` (بالعربي والإنجليزي)
- [ ] Shiki theme متسق مع الـ tokens (خلي الأصفر الكبريتي للـ strings/highlights)
- [ ] RSS ×2 + sitemap + `robots.txt`
- [ ] **اكتب وانشر أول 3 مقالات** (شوف `06-content-backlog.md`)
- [ ] وصّل الدومين + HSTS

### 🚩 نقطة النشر — الموقع أونلاين من هنا

**معيار القبول:** مقال `draft` مش بيتبني، ومقال `unlisted` بيفتح باللينك بس مش في الـ RSS. الموقع شغال بالعربي RTL من غير أي تكسير في الكود بلوكات.

---

## المرحلة 3 — طبقة الإثبات (≈ 12 ساعة)

- [ ] `/projects` + `/projects/[slug]` بالهيكل الكامل (GymOS, Riyadat, DPRIMS) — **بالعربي والإنجليزي**
- [ ] `/labs` من YAML + فلاتر + **`proof` لكل سطر**
- [ ] `/journey` تايم لاين
- [ ] `/arsenal` — جدول قدرات (Domain / Tools / أنا استخدمتها فين فعلاً)، مش أيقونات
- [ ] `StatStrip` في الهوم — 3 أرقام حقيقية بروابط تحقق
- [ ] Open Graph images بتتولد أوتوماتيك لكل مقال (`satori` أو `astro-og-canvas`)

**معيار القبول:** أي رقم على الموقع تقدر تضغط عليه وتتحقق منه. مفيش claim بدون مصدر.

---

## المرحلة 4 — البحث والتلميع (≈ 10 ساعات)

- [ ] Pagefind في الـ build + صفحة `/search` + التحقق من العربي والإنجليزي
- [ ] Command palette (`⌘K`)
- [ ] فلاتر الأرشيف بالـ query params (شغالة بدون JS)
- [ ] Related posts بالـ CWE
- [ ] Series / سلاسل المقالات
- [ ] Light mode (لو هتعمله، اعمله صح: بلوبرنت أزرق على ورق)
- [ ] a11y audit كامل: keyboard-only + قارئ شاشة على صفحة عربية وإنجليزية
- [ ] Security headers (`_headers`) + `security.txt` + اختبار على securityheaders.com

**معيار القبول:** Lighthouse 100/100/100/100 على 3 صفحات مختلفة. `securityheaders.com` = **A+**.

---

## المرحلة 5 — النمو والتفاعل (≈ 8 ساعات)

- [ ] Umami analytics + أحداث محددة (نقر لينكات الإثبات، اشتراك RSS، تبديل اللغة)
- [ ] Giscus للتعليقات على الـ writeups بس
- [ ] Newsletter + صفحة أرشيف للنشرة
- [ ] `/uses`
- [ ] JSON-LD: `Person`, `TechArticle`, `BreadcrumbList`, `WebSite` + `sameAs` لكل حساباتك
- [ ] `sections.hire` لو قررت تفتحه
- [ ] إطلاق: بوست LinkedIn + النشر في مجتمعات مصرية/عربية أمن معلومات

**معيار القبول:** أول رسالة جاية من الموقع متتبّعة بالـ UTM.

---

## المرحلة 6 — الأتمتة والصيانة (مستمر)

- [ ] **Decap CMS** فوق نفس الـ repo → تكتب من الموبايل من غير git
- [ ] GitHub Action: lint + build + `lychee` (لينكات مكسورة) + Lighthouse CI على كل PR
- [ ] Script: `npm run new:writeup` بيولّد ملف بالـ frontmatter كامل
- [ ] مراجعة ربع سنوية: أي مقال قديم يتحدث أو يترشّح (`updatedAt`)
- [ ] Backup للمحتوى في repo تاني

---

## الإجمالي

| المرحلة | الساعات | نتيجة ملموسة |
|---------|---------|----------------|
| 0 | 4 | Deploy pipeline |
| 1 | 12 | هوية بصرية مميزة |
| 2 | 14 | **موقع منشور بمحتوى** |
| 3 | 12 | الإثبات |
| 4 | 10 | بحث + جودة 100 |
| 5 | 8 | نمو |
| **≈ 60 ساعة** | | ≈ 5 أسابيع بمعدل 12 ساعة/أسبوع |

## قاعدة مضادة للتسويف

> **المرحلة 2 ما تخلصش من غير 3 مقالات منشورة.**
> بلوج بديزاين خرافي وصفر مقالات = ضرر لسمعتك. بلوج بسيط بـ 10 writeups عميقة = شغل.
