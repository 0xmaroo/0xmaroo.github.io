# 08 — سقف الجودة (Definition of Done)

> موقع بتاع حد شغال في أمن المعلومات لازم يكون **هو نفسه دليل**. زائر يفتح DevTools ويلاقي headers ناقصة = انطباع أسوأ من عدم وجود موقع.

## 8.1 Security headers — الهدف: A+ على securityheaders.com

`_headers` في Cloudflare Pages:

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin
  X-Frame-Options: DENY
```

**ملاحظات:**
- الـ CSP دي بتشتغل لأن كل حاجة self-hosted (الخطوط، السكريبتات). لو ضفت Giscus أو Umami، زوّد النطاق المحدد بس — **متحطش `unsafe-inline` على `script-src` أبداً**.
- `'unsafe-inline'` على الـ styles مقبولة مؤقتاً بسبب Astro؛ لو عايز تشيلها استخدم hashes.
- بعد ما تتأكد إن كل حاجة شغالة → قدّم الدومين على [hstspreload.org](https://hstspreload.org).

## 8.2 `/.well-known/security.txt` (RFC 9116)

```
Contact: mailto:security@0xmaro.dev
Expires: 2027-01-01T00:00:00.000Z
Preferred-Languages: en, ar
Canonical: https://0xmaro.dev/.well-known/security.txt
Policy: https://0xmaro.dev/security-policy
```
تفصيلة صغيرة، بس أي حد في المجال هيلاحظها فوراً. **حط تذكير في التقويم قبل `Expires` بشهر.**

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

- [ ] `npm run build` بدون تحذيرات
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
