## Goal

Rewrite the Assessments surfaces to match the uploaded `Assessments_Launchely_Design_System.jsx` (desktop) and `Mobile_Assessments.jsx` (native iOS) mockups exactly, while preserving all existing assessment data, scoring, autosave, reflections, analytics, and routes.

## Scope

Four screens × two layouts each (desktop + native-mobile):

1. **Assessments list** (`/assessments`) — `src/pages/Assessments.tsx`
2. **Intro** (start screen) — gating state inside each assessment runner
3. **Question runner** — single-question step UI
4. **Results** — score hero, breakdown bars, reflections

Applies to all three assessments:
- `src/pages/Assessment.tsx` (Launch — 15 questions, 5 sections)
- `src/pages/CoachAssessment.tsx` (Coach — 4 parts)
- `src/pages/WhyStatementAssessment.tsx` (Why Statement — 8 parts)

## Design language to apply

Pulled from the mockups:

- **Palette**: paper `#FBF7F1`, paper-2 `#F7F1E8`, ink `#1F1B17`, terracotta `#C65A3E`, moss `#4F6B52`, plum `#6B3A5C`, hairline `rgba(31,27,23,0.10)`.
- **Typography**: Fraunces display for headings/labels (italic accents on hero words); SF Pro Text body on mobile, existing system body on desktop.
- **Cards**: white, 14–22px radius, hairline border on desktop, soft shadow on mobile, no left-border stripe.
- **Status chips**: moss "Completed", terracotta dot "In progress", inline progress bar.
- **Buttons**: pill (`border-radius: 999`) on desktop; rounded 14–16 on mobile; ink-dark primary, paper-tint secondary.
- **Hero blocks**: warm clay gradient with radial glow, ink icon tile, meta pills.

## Native-mobile behavior (Capacitor-friendly)

Render the mobile layout when `useIsMobile()` is true OR `useIsNativeApp()` is true:

- Full-bleed paper background, no app sidebar/topbar (hide ProjectLayout chrome on these routes for mobile).
- Sticky top nav with `Back` (terracotta text) + centered title + right action (`Save`/`Share`).
- Sticky bottom CTA bar with `backdrop-filter: blur(20px) saturate(180%)` and `padding-bottom: env(safe-area-inset-bottom)`.
- Large iOS title section + Fraunces serif accent.
- Inset grouped lists (sections/breakdown).
- Tap targets ≥44pt; momentum scroll (`-webkit-overflow-scrolling: touch`); 240ms ease-out for progress + selection.
- Haptic feedback hook on option select, Next/Prev, Save (Capacitor `@capacitor/haptics` if available; no-op web fallback).
- Status bar / home indicator chrome is supplied by the device — do NOT render the dummy bezel from the mockup; just leave correct safe-area padding.
- Hide the existing `MobileTabBar` while inside an assessment runner (full-screen flow).

## File-by-file changes

### `src/pages/Assessments.tsx` (list)

- Replace the current Card grid with the design-system layout:
  - Editorial PageHeader with eyebrow `ASSESSMENTS`, Fraunces title `Know where you actually stand.` (italic "actually" in terracotta), lede.
  - Featured clay "Why bother taking these?" block.
  - Card list mapped from the existing 3 assessments + driven by saved status (`ready` / `in-progress` / `completed`).
  - Status chip + meta pills (`~10 min`, `15 questions`).
  - Score + label badge when completed; progress bar when in-progress.
  - Primary action: `Start` / `Resume` / `View results` linking to existing routes.
- Mobile variant: large-title scroll view, inset cards, no app chrome.

### `src/pages/Assessment.tsx`, `CoachAssessment.tsx`, `WhyStatementAssessment.tsx`

Keep all existing data, scoring, autosave, analytics, navigation, and routes. Replace JSX only.

Each gets four UI states wired to existing state machines:

1. **Intro** (when `!hasStarted`): hero clay card with assessment title + meta pills, "Before you begin" instructions card, sections list (numbered), CTA `Begin assessment` + `Save for later`.
2. **Question** (during run): top progress strip (`Step n of N · Section · pct%`), white question card with eyebrow `Question n`, Fraunces prompt, lettered option buttons (selected = ink fill, terracotta letter chip, check icon), Prev / Save & exit / Next footer.
3. **Reflections**: same card layout as results but with textareas, autosave preserved.
4. **Results**: hero card with circle icon, range pill, label (Fraunces), large score `42 / 45`, "What this means / significance / focus" copy blocks, section breakdown bars (moss when full, terracotta otherwise), reflection accordion, sticky `Save` + `Apply to your launch` actions.

Mobile variants mirror the `Mobile_Assessments.jsx` flows: sticky top nav with Exit/Save, single progress bar, inset option list, sticky `Prev / Next` footer, results show "Show N more questions" expand affordance.

### Shared helpers

New `src/components/assessments/` directory with:

- `AssessmentShell.tsx` — picks desktop vs mobile (uses `useIsMobile`, `useIsNativeApp`); supplies sticky top nav + bottom CTA slots; hides ProjectLayout chrome on mobile.
- `AssessmentHero.tsx`, `SectionsList.tsx`, `OptionButton.tsx`, `ProgressStrip.tsx`, `ResultHero.tsx`, `BreakdownBars.tsx`, `ReflectionsCard.tsx`.
- `tokens.ts` — shared color/font constants from the mockups so all three runners share styling.
- `useHaptics.ts` — wraps Capacitor `@capacitor/haptics` with web fallback.

Each existing assessment page becomes a thin wrapper that maps its data into these components. No business logic changes.

## Out of scope

- No DB / schema changes.
- No new analytics events (existing `trackAssessmentCompletion` calls preserved).
- No changes to the Why Statement worksheet's domain logic, just visual layout.
- The "Audience clarity" / "Offer readiness" mock cards from the mockup data are illustrative — only the 3 real assessments will be rendered.

## Acceptance

- Desktop matches the design-system mockup layout, spacing, type scale.
- Mobile (and native app) shows full-screen iOS chrome: large titles, inset cards, sticky bottom CTA respecting safe area, no app sidebar/tabbar in the assessment flow.
- All three assessments still: load saved progress, autosave, score correctly, store reflections, fire analytics, and navigate back to `/assessments`.
