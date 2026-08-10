# CLAUDE.md — 0xmaro.dev

Read this file before every task. Read `plan/` before writing code.
`plan/03-design-system.md` and `plan/02-architecture.md` are **binding specs**, not suggestions.

## What this is

A bilingual (EN/AR) security blog + portfolio for 0xMaro — a full-stack developer moving into
application security. Positioning: `- I build systems that work.` / `+ I break systems that work.`
Every writeup ends with a real code-level fix. That is the whole point of the site.

## Stack — do not substitute

Astro 5+ · MDX · TypeScript (strict) · plain CSS with custom properties · Pagefind · Cloudflare Pages.

**Do NOT introduce, ever, without being asked:** Tailwind, a UI component library, a CSS-in-JS
runtime, React/Vue islands for anything static, a state manager, an analytics SDK with cookies,
Google Fonts CDN (fonts are self-hosted), or any dependency that ships client JS to a reading page.

Budget: **< 15KB of JS on an article page.** If a feature needs more, propose it first.

## Hard rules (a violation of any of these is a bug, not a style opinion)

1. **No physical CSS directions.** `margin-inline-start`, `padding-block`, `inset-inline-end`.
   Any `left:` / `right:` / `margin-left` / `text-align: left` in the codebase fails review.
2. **Never hardcode a color, font-size, or spacing value.** Everything comes from
   `src/styles/tokens.css`. If a token is missing, add it there first.
3. **No user-facing English string inside a component.** All UI text comes from `src/i18n/ui.ts`.
4. **No manual internal links.** Use `getRelativeLocaleUrl()` from `astro:i18n`.
5. **Arabic typography:** never `letter-spacing`, never `text-transform: uppercase`, never
   font-weight below 400, `line-height: 1.85`, Western digits (1234) in technical context.
6. **Code, terminal and payload blocks are always `dir="ltr"`**, including inside Arabic pages.
7. **All content filtering goes through `forSurface()` in `src/lib/content.ts`.** A page that
   filters entries itself is a bug — that is how drafts leak into RSS.
8. **Respect `prefers-reduced-motion`** in every animation you write.
9. **Accessibility floor:** visible focus ring, keyboard reachable, one `<h1>`, labelled controls,
   44px touch targets. Do not ship a component that fails these.
10. **No emoji, no gradients on surfaces, no parallax, no falling code, no custom cursor.**
    Motion is limited to the four cases listed in `plan/03-design-system.md §3.6`.

## Colour discipline

- Blue = structure and metadata. Sulfur yellow = the one thing to notice (max ~5% of a screen).
- Red is **only** severity stamps and errors. Never a button, a hover, or a heading.

## Working style

- Small commits, Conventional Commits (`feat:`, `fix:`, `style:`, `docs:`).
- After each phase: run `npm run build`, report Lighthouse, and list what you did NOT do.
- If a spec in `plan/` is ambiguous or you think it is wrong, **say so and propose an
  alternative before implementing**. Do not silently choose.
- Never invent content. Placeholder copy must be marked `TODO(copy)`. Never invent a
  certification, a rank, a metric, or a proof link — every number on this site is verifiable.

## Definition of done for any UI task

Works at 360px wide · works in RTL · keyboard navigable · reduced-motion respected ·
no new client JS beyond budget · tokens only · `npm run build` clean.
