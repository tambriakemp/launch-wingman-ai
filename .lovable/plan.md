

## Redesign Landing Page — Editorial Cream + Terracotta

Match the uploaded design system (cream background, serif italic headlines, terracotta accent) on the marketing landing page, while keeping all existing product mockups but recoloring them to fit the new palette.

### New design system

**Color palette** (added as scoped landing CSS variables, won't affect the app):
- Background: `#FBF7F1` (warm cream)
- Foreground / ink: `#1F1B17` (near-black)
- Muted ink: `#5C544B` (warm gray)
- Hairline border: `#E8E1D5`
- Card: `#FFFFFF`
- Accent (terracotta): `#C65A3E` — used for the period in "Launchely.", italic emphasis words ("Start launching"), eyebrow labels, X icons, dot bullets, FAQ +, "Due tomorrow"
- Mockup browser chrome: cream tone instead of grey

**Typography**:
- Headlines: serif (`Playfair Display` via Google Fonts, weights 500/600/700) — large, with selected words in italic terracotta
- Eyebrow labels: small uppercase tracked, terracotta
- Body & UI: keep `Plus Jakarta Sans`
- Quotes: serif italic

**Layout primitives**:
- Pill-shaped floating header (rounded-full, white, hairline border, centered nav)
- Generous whitespace, minimal cards (white on cream, subtle 1px border, soft shadow)
- Section eyebrow → big serif headline → italic serif subhead pattern
- Audience tags as plain text in flowing rows (not pills)
- Pricing cards: white, italic serif tier names, oversized serif `$25` with small `/mo`, "MOST POPULAR" small uppercase tracked label above the Pro card
- FAQ: flat rows separated by hairlines, terracotta `+` toggles
- Final CTA: small uppercase eyebrow, huge serif `Stop watching. Start shipping.` with "Start shipping." in italic terracotta, simple text-link CTA

### Sections (preserved structure, restyled)

1. **Hero** — cream bg, eyebrow `◆ AI-POWERED · BUILT FOR COACHES & CREATORS`, serif headline `Stop buying courses. Start launching.` (last two words italic terracotta), italic serif subhead, text-link "Start free today" + outline pill button "See features →", helper line under buttons. **Dashboard mockup** sits below in a soft floating frame.
2. **Marquee strip** — keep, restyle to cream/ink tokens.
3. **Sound familiar?** — eyebrow `SOUND FAMILIAR?`, serif headline, 2×3 white cards with terracotta `✕` and ink text (no emoji).
4. **The Shift (Old vs New)** — eyebrow `THE SHIFT`, serif headline `Everything you need. Nothing you don't.`, single rounded card with two columns split by hairline, italic serif column titles, rows separated by hairlines, terracotta ✕ vs ink ✓.
5. **Launch / Marketing / Resources / Planning** — four alternating feature blocks. Each: eyebrow (terracotta), large serif headline, italic serif lede, terracotta ✓ checklist, paired mockup (Tasks / AI Studio / Content Vault / Planner) in restyled BrowserFrame.
6. **Powered by AI** — eyebrow + headline + italic subhead + 4 minimal feature cards.
7. **How it works** — 3 numbered steps (`01 02 03` in light serif), each with serif title + body.
8. **Built for you** — audience names as plain serif text in flowing centered rows, then big serif italic Sarah Chen quote with "under two weeks" in terracotta.
9. **Pricing** — 4 cards in a row, italic serif tier names, oversized serif prices, MOST POPULAR label on Pro, simple feature list with terracotta dot bullets, single CTA per card.
10. **FAQ** — flat hairline-separated accordion, serif questions, terracotta `+`/`−`.
11. **Final CTA** — `READY TO LAUNCH?` eyebrow + huge serif headline + text-link CTA.
12. **Footer** — restyled to cream/ink with serif `Launchely.` wordmark.

### Mockup recoloring

All 7 mockups (`DashboardMockup`, `TasksMockup`, `AIStudioMockup`, `SocialHubMockup`, `ContentVaultMockup`, `PlannerMockup`, `TransformationMockup`) keep their layout and content but are recolored:
- `BrowserFrame` chrome → cream `#F5EFE5` header, hairline border, soft shadow
- Replace the bright accent yellow / blue pill colors used inside mockups with terracotta (`#C65A3E`) for primary actions and a warm gold `#D4A24C` only where a secondary highlight is needed
- Cards inside mockups: white on cream
- Status colors: keep semantic green for "Completed", swap "Due tomorrow"/urgent to terracotta, swap progress bar fills to terracotta
- Replace any pure neutral greys with warm-tinted greys to match cream theme

This is done by passing landing-scoped CSS variables to a wrapper around each mockup so the same components render with the new palette only on the landing page (no impact on the actual app).

### Header

Replace current dark/transparent header with a floating **pill nav**: white rounded-full bar, hairline border, soft shadow, centered links (`Features · How it works · Pricing · FAQ`), `Sign in` link + `Start free` outline pill on the right. Same fixed-top behavior, sits 16px from top.

### Technical notes

- New file `src/components/landing/landing-theme.css` defines scoped tokens under a `.landing-theme` class:
  - `--bg`, `--ink`, `--muted-ink`, `--hairline`, `--card`, `--accent`, `--accent-soft`, plus serif font stack and remaps `--background/--foreground/--card/--border/--accent/--muted` only inside that scope.
- Wrap `Landing.tsx` root in `<div className="landing-theme font-sans">`. All children (including `LandingHeader`, `LandingFooter`, and mockups) inherit the remapped tokens — no per-component color rewrites needed for the body of the page.
- Add `Playfair Display` via `@fontsource/playfair-display` (weights 500, 600, 700) and add a `font-serif` Tailwind family in `tailwind.config.ts`. Use `font-serif italic` utility for emphasized headline words and quote blocks.
- Replace the existing yellow `--accent` lookups inside the landing scope with terracotta. Inside mockups, swap hardcoded `bg-amber-*` / `text-amber-*` / yellow used as primary highlight to `var(--accent)` via a small set of utility class swaps; status semantic colors (green for done, blue for info) stay.
- `LandingHeader` updated: detect `landing-theme` ancestor and render the pill style; on other pages it keeps current behavior.
- `BrowserFrame` accepts an optional `tone="cream"` prop; landing page passes it. App usages elsewhere are unaffected.
- All animations (Framer Motion) preserved.
- Mobile: stack hero, single-column features, vertical pricing cards, hamburger menu in pill header.

### Files to change

- `src/pages/Landing.tsx` (full restructure of section markup + classes; data arrays kept)
- `src/components/landing/LandingHeader.tsx` (pill variant)
- `src/components/landing/LandingFooter.tsx` (cream restyle)
- `src/components/landing/BrowserFrame.tsx` (add `tone` prop, cream variant)
- `src/components/landing/landing-theme.css` (new — scoped tokens + Playfair import)
- `src/index.css` (import the new file)
- `tailwind.config.ts` (add `font-serif: ["Playfair Display", ...]`)
- All 7 mockup files in `src/components/landing/screenshots/` (swap yellow/blue primary highlights to `var(--accent)` via class changes; layout untouched)
- `package.json` — add `@fontsource/playfair-display`

### Out of scope

- The signed-in app (`/app/...`), feature subpages (`/features/*`), Auth, Pricing checkout, and other public pages (`About`, `Contact`, `HowItWorks`, `Blog`) keep their current look unless you ask. We can roll the same theme to those next as a follow-up.

