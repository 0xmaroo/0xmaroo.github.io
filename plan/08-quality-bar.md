# 08 — سقف الجودة (Definition of Done)

> موقع بتاع حد شغال في أمن المعلومات لازم يكون **هو نفسه دليل**. زائر يفتح DevTools ويلاقي headers ناقصة = انطباع أسوأ من عدم وجود موقع.

## 8.1 Security headers — CSP وReferrer-Policy عن طريق `<meta>` (A+ على securityheaders.com غير ممكن على GitHub Pages)

**المضيف (مُعتمد — قرار نهائي):** **GitHub Pages** على repo اسمه `0xmaroo.github.io` (user page — عشان كده `base` سايبها `/`). GitHub هو مصدر الحقيقة، والـ deploy عن طريق GitHub Actions (`withastro/action` + `actions/deploy-pages`)، والأمر `npm run build` بيشغّل Astro **وبعدين** Pagefind، والـ artifact = `dist/`.

> **الملاحظة الجوهرية:** GitHub Pages **ما بيديش أي تحكم في الـ response headers** — مفيش ملف `_headers` ولا server config. أي حاجة كانت مكتوبة في `public/_headers` سابقاً مش متاحة هنا. اللي لسه بينفع فوق GitHub Pages هو `<meta http-equiv>` جوه الـ `<head>` بس.

**اللي ينفع نعملوه فوق GitHub Pages:**

1. **CSP** — `<meta http-equiv="Content-Security-Policy">`:
   ```
   default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests
   ```
   - مفيش nonces ولا hashes في الـ meta CSP، فعشان `script-src 'self'` يشتغل من غير `unsafe-inline`، **كل السكريبتات لازم تبقى ملفات خارجية**. Astro بيضمّر السكريبتات الصغيرة (أقل من 4KB) inline جوه الصفحة افتراضياً — نضبط `vite.build.assetsInlineLimit: 0` في `astro.config.mjs` علشان كل السكريبتات تتحوّل لملفات `/_astro/*.js`. نفس المنطق للـ styles: `build.inlineStylesheets: 'never'` عشان `style-src 'self'` ما يتكسّرش.
   - **الـ directives اللي مش بتشتغل في الـ meta:** `frame-ancestors` و`report-to` و`sandbox` — مستحيل ضبطهم من جوه الصفحة.
2. **Referrer-Policy** — `<meta name="referrer" content="strict-origin-when-cross-origin">`.
3. **`/.well-known/security.txt`** — ملف static، شغال عادي (§8.2).

**مش متاح على GitHub Pages (خالص):** `Strict-Transport-Security` (HSTS)، `X-Frame-Options`، `X-Content-Type-Options`، `Permissions-Policy`، `Cross-Origin-Opener-Policy` (COOP)، `Cross-Origin-Resource-Policy` (CORP). دي مش متحققة إلا بنقل المضيف أو حطّ CDN قدامه. **نرجع نراجع لو الموقع اتغيّر مضيفه.**

**ملاحظة بخصوص HTTPS:** `*.github.io` شغال بـ HTTPS أصلاً. ولو اتربط دومين `0xmaro.dev` (`.dev`) بعدين، الـ TLD نفسه متقدّم في HSTS preload على مستوى المتصفح — HTTPS اجبارية تلقائياً من غير أي header. يعني فقدان الـ HSTS header عملياً مش فقدان حماية حقيقية في الحالتين.

**نشر:**

- الـ workflow: `npm ci` → `npm run build` (Astro + Pagefind في نفس الأمر — لو Pagefind اتنفذ برّه الـ build، الـ index مش هيبقى جوه الـ artifact اللي بيتنشر) → `upload-pages-artifact` (path: `dist`) → `deploy-pages`.
- **`public/.nojekyll` إجباري** — من غيره Jekyll بيبتر `_astro/` والموقع بينزل من غير CSS/JS. نتأكد إنه موجود في `dist/` بعد كل build.
- فعّل **Enforce HTTPS** في إعدادات Pages.
- كل الـ Actions في `deploy.yml` **مثبتة على commit SHAs كاملة** (مفيش floating tags) — الأمان supply-chain لازم يبقى محسوس في الشغل نفسه. **تراجع الـ SHAs دي على الربع** مع مراجعة Phase 6 في `05-roadmap.md`.
- لو اتضاف دومين مخصوص يوم من الأيام: غيّر سطر `site` بس في `astro.config.mjs` (معلّم عليه كومنت بأنه السطر الوحيد اللي بيتغيّر) + ضيف `CNAME` — الـ TLS بيشتغل تلقائياً.

## 8.2 `/.well-known/security.txt` (RFC 9116)

```
Contact: mailto:__TODO(copy)-عند-المالك-عنوان-فعلي-بيتحكم-فيه-اليوم__
Expires: 2027-01-01T00:00:00.000Z
Preferred-Languages: en, ar
Canonical: https://0xmaroo.github.io/.well-known/security.txt
Policy: https://0xmaroo.github.io/security-policy
```
تفصيلة صغيرة، بس أي حد في المجال هيلاحظها فوراً. **حط تذكير في التقويم قبل `Expires` بشهر.**

**قبل Phase 4، خد من المالك عنوان اتصال فعلي بيتحكم فيه اليوم** — ممنوع إيميل على دومين احنا مش مالكينه. نفس القاعدة في `humans.txt` وJSON-LD `sameAs`: **روابط/عناوين شغالة بس**، ومفيش `0xmaro.dev` غير مربوط.

## 8.3 الأداء

| المؤشر | الهدف |
|--------|-------|
| Lighthouse (الأربعة) | **100** |
| LCP | < 1.2s على 4G |
| CLS | 0 (احجز أبعاد كل صورة) |
| JS المشحون على صفحة مقال | **< 15KB** |
| الخطوط | woff2، subset، `font-display: swap`، preload لخط الـ body بس |
| الصور | AVIF/WebP عبر `<Image />` بتاعة Astro، lazy ما عدا الـ hero |

**نقطة مهمة للعربي:** subset الخط العربي لازم يشمل النطاقات `U+0600-06FF, U+0750-077F, U+FB50-FDFF, U+FE70-FEFF` + علامات الترقيم اللاتينية (لأن النص التقني بيخلط).

## 8.4 إمكانية الوصول

- [ ] تنقّل بالكيبورد بالكامل، وترتيب focus منطقي، وfocus مرئي في كل مكان
- [ ] `Skip to content`
- [ ] تباين AAA للنص الأساسي، AA على الأقل للثانوي
- [ ] عناوين مرتبة (h1 واحد لكل صفحة، مفيش قفز في المستويات)
- [ ] `alt` وصفي لكل صورة (والصور الزخرفية `alt=""`)
- [ ] كل form control ليه `<label>`
- [ ] `prefers-reduced-motion` محترم في كل الحركات
- [ ] اختبار بقارئ شاشة على صفحة **عربية** وصفحة **إنجليزية** (VoiceOver أو NVDA)
- [ ] الموقع مقروء عند تكبير 200%

## 8.5 اختبار RTL (الجزء اللي بيتنسى وبيكسر كل حاجة)

- [ ] الكود والـ terminal `dir="ltr"` جوه الصفحات العربية
- [ ] الأسهم والأيقونات الاتجاهية بتنعكس (`transform: scaleX(-1)` أو أيقونة منطقية)
- [ ] الـ TOC ومؤشر التقدم بيتحركوا للجهة الصح
- [ ] مفيش `left/right` في الـ CSS — logical properties بس
- [ ] النصوص المخلوطة (عربي + `SQL Injection` + `CVE-2021-44228`) بتظهر صح من غير ترتيب مقلوب — استخدم `<bdi>` حوالين المصطلحات التقنية جوه الجُمل العربية عند اللزوم
- [ ] علامات الترقيم في آخر الجملة العربية في مكانها الصح
- [ ] الـ LangSwitch بيوديك لنفس الصفحة، مش للهوم

## 8.6 قبل كل نشر

- [ ] `npm run build` بدون تحذيرات (Astro + Pagefind)
- [ ] فحص الـ index: `scripts/check-pagefind.sh` بيفشل الـ build لو Pagefind طلّع 0 records (منع index فاضي من غير صويت)
- [ ] `dist/.nojekyll` موجود (من غيره Jekyll بيبتر `_astro/` → الصفحة بتنزل من غير CSS/JS)
- [ ] نتايج البحث (Pagefind) موجودة جوه الـ output اللي بيتنشر
- [ ] الـ `<meta http-equiv="Content-Security-Policy">` و`<meta name="referrer">` موجودين في الصفحات الحية (DevTools → Elements). *مش متاح على GitHub Pages:* HSTS / X-Frame-Options / X-Content-Type-Options / Permissions-Policy / COOP / CORP.
- [ ] راجع الـ pinned SHAs بتاعة الـ Actions في `.github/workflows/deploy.yml` — بتتحدث على الربع (مع Phase 6 في `05-roadmap.md`)
- [ ] `lychee` — صفر لينكات مكسورة
- [ ] المقال فيه قسم Fix وقسم Dead ends
- [ ] كل الـ payloads مغفّلة، ومفيش أي بيانات حقيقية
- [ ] `<Callout type="legal">` موجود لو الهدف مش ملكك
- [ ] OG image بتتولد صح (اختبر على linkedin post inspector)
- [ ] اقرا المقال على موبايل قبل ما تنشره
- [ ] `visibility.draft: false` ✓

## 8.7 مبادئ ثابتة

1. **ما تنشرش حاجة مش متأكد منها تقنياً.** غلطة تقنية واحدة في مقال بتكلفك أكتر من 10 مقالات ما اتكتبتش.
2. **الشغل الحقيقي > الشغل المثالي.** موقع فيه 8 مقالات وديزاين 90% أحسن من موقع فيه 0 مقالات وديزاين 100%.
3. **كل ثلاث شهور:** ارجع للمقالات القديمة، حدّثها، وحط `updatedAt`. المحتوى الحي بيترتب أعلى وبيبان عليه اهتمام.
