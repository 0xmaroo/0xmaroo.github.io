# 06 — خطة المحتوى · أول 18 مقال

المقالات دي **مش أفكار عامة** — كلها متبنية على حاجة أنت عملتها فعلاً. ده اللي بيخلي المحتوى غير قابل للتقليد.

## الأعمدة الأربعة

| العمود | النسبة | ليه |
|--------|--------|-----|
| **A · Break my own build** | 30% | ملكك أنت وحدك. مفيش حد تاني عنده production system بناه وبيهاجمه |
| **B · Writeups (CTF / Labs / ثغرات)** | 35% | إثبات المهارة الهجومية |
| **C · Bilingual explainers** | 25% | ترافيك + الجمهور العربي |
| **D · Notes / ملخصات / TIL** | 10% | الموقع يفضل حي بين المقالات الكبيرة |

---

## المجموعة الأولى (المرحلة 2) — لازم تنزل مع الإطلاق

| # | العنوان (EN) | العمود | النوع | ليه ده أول واحد |
|---|--------------|--------|-------|-----------------|
| 1 | **I attacked the gym system I built. Here's what I found.** | A | Writeup · own-system | ده المقال اللي بيثبت الـ positioning كله في ضربة واحدة. عندك الكود، فتقدر تكتب Root cause + Fix بشكل مفيش حد يقدر يقلّده |
| 2 | **From Cyber Security 101 to #3 in Egypt: what actually mattered** | C | Retrospective | فيه إثبات قابل للتحقق، وبيجيب ترافيك من ناس بتبدأ، وبيوصل قيمة حقيقية (إيه اللي نفع وإيه اللي كان مضيعة وقت) |
| 3 | **ASCWG 2025: the challenge we solved 20 minutes before the buzzer** | B | CTF writeup | قصة فيها توتر حقيقي + شرح تقني. الـ CTF writeups هي أسرع طريق لسمعة داخل المجتمع |

## المجموعة الثانية (المرحلة 3)

| # | العنوان | العمود | ملاحظات |
|---|---------|--------|---------|
| 4 | Authorization is not a middleware: 4 IDOR patterns from real code | A/C | من أنظمتك الحقيقية، بأمثلة كود مغفّلة الهوية |
| 5 | DPRIMS: what an ESP32 taught me about trusting sensor data | A | زاوية IoT/OT — نادرة جداً في السوق المصري |
| 6 | **الدليل الكامل لـ SQL Injection — من الأساسيات للـ blind** | C (عربي) | مفيش محتوى عربي محترم في الموضوع ده. سلسلة، مش مقال واحد |
| 7 | Rebuilding my auth flow after CAP: 6 things I was doing wrong | A | ربط الشهادة بشغل حقيقي بدل ما تعلقها كصورة |
| 8 | eCDFP in practice: forensic triage on a Windows box, start to finish | B | يفتح لك جمهور الـ DFIR كمان |
| 9 | **ليه CORS مش نظام مصادقة** | C (عربي) | سوء فهم منتشر جداً — مقالات "تصحيح المفاهيم" بتنتشر أكتر من الشروحات |

## المجموعة الثالثة (المرحلة 4–5)

| # | العنوان | العمود |
|---|---------|--------|
| 10 | Reading the Riyadat codebase like an attacker: a self-review | A |
| 11 | HTB writeups series — واحدة كل أسبوعين (retired boxes بس) | B |
| 12 | The Burp extensions I actually use (and 3 I uninstalled) | D |
| 13 | ملخص: *The Web Application Hacker's Handbook* — إيه اللي لسه صالح في 2026 | D (عربي) |
| 14 | ملخص: *Real-World Bug Hunting* — بفهم مطوّر | D (عربي) |
| 15 | File upload: the 7 checks people skip (with Node.js code) | C |
| 16 | Splunk use cases from the DFIR bootcamp, rewritten for a small team | B |
| 17 | **من Full-Stack لـ Security: خريطة الطريق اللي مشيتها فعلاً** | C (عربي) — هيكون أكتر مقال بيتشارك عندك |
| 18 | ICMTC 2025: the qualifier chain that got us onsite | B |

---

## قالب الـ writeup (انسخه في كل مرة)

```mdx
---
title: ""
summary: ""            # 80–200 حرف — ده اللي بيظهر في جوجل
lang: "en"
publishedAt: 2026-08-20
category: "web"
tags: []
target: ""             # اسم النظام أو الـ machine
targetType: "own-system"
cwe: []
owasp: []
severity: "high"
status: "patched"
hasFix: true
toolsUsed: []
visibility: { draft: true }
---

## 01 — The target
## 02 — Recon
## 03 — The bug
## 04 — Exploitation
<Payload lang="http">...</Payload>
## 05 — Dead ends
<DeadEnd>...</DeadEnd>
## 06 — The fix
<FixDiff before={``} after={``} />
## 07 — What it teaches
```

---

## قواعد ما تتكسرش

1. **الشرعية:** أي writeup على نظام مش ملكك لازم يكون: CTF/lab، أو منصة bug bounty في نطاقها، أو إذن كتابي. حط `<Callout type="legal">` في أول المقال. مقال واحد فيه شبهة = سمعتك خلصت.
2. **التغفيل (Sanitization):** غيّر النطاقات، والتوكينات، وأسماء العملاء، وبيانات المستخدمين. حط شارة "sanitized" على أي payload متعدّل.
3. **أنظمة عملائك (Riyadat / GymOS لو ليها عملاء):** ما تنشرش تفاصيل ثغرة في نظام شغال عند عميل. اكتب عن **النمط** مش عن النسخة، وبعد ما يتصلح، وبكود مُعاد كتابته للمقال.
4. **إسناد الفضل:** لو المشروع شغل فريق، اكتب دورك بالظبط. `role` حقل إلزامي في الـ schema لسبب.
5. **إيقاع النشر:** مقال كل أسبوعين ثابت **أحسن من** 4 مقالات في أسبوع وبعدين شهرين سكوت. الخوارزمية والبشر الاتنين بيكافئوا الثبات.

## من مقال واحد لـ 4 قطع محتوى

لكل writeup تنشره:
1. المقال نفسه على الموقع.
2. بوست LinkedIn: أهم درس واحد + لينك (مش ملخص المقال — سبب واحد يخليهم يفتحوا).
3. Thread على X: الـ 5 خطوات مختصرة.
4. Note قصيرة على الموقع: تفصيلة جانبية طلعت أثناء الشغل.
