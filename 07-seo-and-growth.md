# 07 — SEO والنمو

## 7.1 SEO تقني (الأساسيات اللي بتتنسي)

- **hreflang إلزامي** على كل صفحة ليها نسختين:
```html
<link rel="alternate" hreflang="en" href="https://0xmaro.dev/writeups/slug" />
<link rel="alternate" hreflang="ar" href="https://0xmaro.dev/ar/writeups/slug" />
<link rel="alternate" hreflang="x-default" href="https://0xmaro.dev/writeups/slug" />
```
- `<link rel="canonical">` مطلق على كل صفحة. مقال `unlisted` → `<meta name="robots" content="noindex,follow">`.
- `<html lang="ar" dir="rtl">` — **الاتنين**. Pagefind بيعتمد على `lang` علشان يفصل الفهارس، فأي غلط هنا بيكسر البحث العربي كمان.
- Sitemap واحد بلغتين مع روابط `xhtml:link` بين النسخ.
- OG image لكل مقال (1200×630) — يتولد وقت الـ build: العنوان + `CASE 0xx` + الـ CWE على خلفية البلوبرنت. اللينك اللي بيتشارك في لينكدإن هو نص الانطباع الأول.

## 7.2 Structured data (JSON-LD)

- على `/` و`/about`: `Person` مع `sameAs` لكل حساباتك (LinkedIn, GitHub, X, TryHackMe, HTB) + `alumniOf` + `knowsAbout`.
- على كل writeup: `TechArticle` مع `datePublished`, `dateModified`, `author`, `about` (CWE), `inLanguage`.
- `BreadcrumbList` على كل الصفحات الداخلية.
- `WebSite` مع `potentialAction: SearchAction`.

ده اللي بيخلي جوجل يعرض اسمك ككيان مرتبط بـ "security research"، ومهم جداً كمان لأدوات الـ AI اللي بتقرا المواقع دلوقتي.

## 7.3 اختيار الكلمات — منطق مختلف للغتين

**بالإنجليزي:** ما تنافسش على `SQL injection tutorial` (مستحيل). نافس على الذيل الطويل:
`IDOR in invoice endpoints Laravel`, `ESP32 sensor spoofing`, `Node.js file upload bypass magic bytes`.
المقالات اللي فيها **كود + fix** بتترتب أعلى بكتير من الشروحات العامة.

**بالعربي:** المنافسة شبه معدومة والجودة الموجودة ضعيفة. مقال عربي واحد كويس عن `SSRF` أو `JWT` ممكن يبقى أول نتيجة في شهور. **دي أكبر فرصة ترافيك عندك، وأغلب الناس بتتجاهلها.**

## 7.4 حلقة التوزيع

```
writeup على الموقع
   ├── LinkedIn (جمهورك موجود هناك فعلاً) → درس واحد + لينك
   ├── X/Twitter → thread تقني + لينك
   ├── مجتمعات عربية (Discord/Facebook groups) → القيمة الأول، اللينك بعدين
   └── r/netsec أو r/webdev → للمقالات العميقة بس، وبأدب
```

- **ما تنشرش نسخة كاملة على Medium أو Dev.to.** لو نشرت، خليها canonical على موقعك. أنت عايز الترافيك يبني الدومين بتاعك مش دومين حد تاني.
- كل لينك بتنشره فيه UTM: `?utm_source=linkedin&utm_medium=post&utm_campaign=writeup-14` — كده تعرف مين بيجيب الشغل فعلاً.
- **ما تنشرش وتختفي.** أول ساعتين بعد النشر: رد على كل تعليق. ده بيضاعف الوصول أكتر من أي حاجة تانية.

## 7.5 لينكدإن — أنت شغال عليه صح، خليه يشتغل أكتر

الهيدلاين الحالي فيه شهادات. حوّله لـ positioning:
```
Full-Stack Developer → Application Security  ·  I build production systems, then break them
CAP · eCDFP · CTF: liel0x1  ·  0xmaro.dev
```
- حط `0xmaro.dev` في قسم Featured وفي الـ Contact info.
- بوستات الشهادات كويسة، بس اللي بيجيب شغل هو: **"دي ثغرة، ده جذرها، ده الإصلاح."**

## 7.6 قياس (وأنت متحكم في الخصوصية)

- **Umami** أو Cloudflare Web Analytics. مفيش كوكيز، مفيش بانر موافقة، ومتسق مع هوية الموقع.
- الأحداث اللي تهم فعلاً: نقر لينكات الإثبات (proof)، عمق قراءة الـ writeups، تبديل اللغة، اشتراك RSS/Newsletter، نقر Contact.
- **مؤشر واحد بس هو المهم:** كام رسالة جادة وصلتك من الموقع. الباقي أرقام مريحة نفسياً.

## 7.7 لما البلوج يشتغل — الخطوة اللي بعدها

الموقع مش الهدف، ده منصة الإطلاق. لما يبقى عندك 10 writeups عميقة:
1. قدّم على bug bounty programs (HackerOne / Bugcrowd / منصات عربية) — والـ writeups بتاعتك تبقى ملف تعريفك.
2. اعرض security review مجاني على 2–3 شركات ناشئة مصرية مقابل الإذن بالنشر (بعد الإصلاح). ده بيبني portfolio حقيقي.
3. قدّم ورقة/جلسة في مؤتمر محلي — الـ writeups بتبقى المادة جاهزة.
