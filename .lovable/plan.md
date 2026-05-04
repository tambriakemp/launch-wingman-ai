## Goal

Rebuild `src/pages/project/Playbook.tsx` so the desktop and mobile views match the uploaded mockups (`Launchely_Playbook.jsx` and `Mobile_Playbook_Launchely_Design_System.jsx`) exactly: an editorial "field guide" treatment with a chapter rail, a featured pull-quote, numbered insight entries, and a contextual sidebar (desktop) / stacked sections (mobile).

The existing data sources stay the same (`usePlaybookData`, active phase, `PHASE_WISDOM`); only presentation changes. Demo strings shown in the mockups become fallbacks when real data isn't available.

## Design tokens used

The project already exposes these CSS vars in `src/index.css`: `--paper-100`, `--paper-200`, `--ink-900`, `--terracotta-500`, `--clay-200`, `--border-hairline`, `--font-display` (Fraunces), `--font-body`, `--font-mono`. We'll consume them via inline styles where Tailwind doesn't cover them, matching the mockup styling exactly.

## Content mapping

Mockup element → real data source:
- Chapter rail (6 chapters: Planning, Messaging, Build, Content, Pre-launch, Launch) → existing project phases. Active = `activePhaseData.active_phase`. "Done" = phases before active. Counts pulled from `PHASE_WISDOM[phase].length` + project-derived insight counts.
- Featured pull-quote → first item from `data.insights` (or first `PHASE_WISDOM[currentPhase]` tip when not enough completed projects).
- Numbered editorial entries → remaining `data.insights` mapped to `{ n, tag, headline, body, meta }`. `tag` from category label ("On voice", "On clarity"…), `headline` from insight text first sentence, `body` from remainder, `meta` from category source.
- Sidebar "What helps now" → `PHASE_WISDOM[currentPhase]` (top 4).
- Sidebar "Your pattern" (dark card) → first insight in `data.insights` with category `general`, fallback to a static line.
- Sidebar "Up next" → next phase after `currentPhase`.

## Layout

Desktop (≥`md`):

```text
+-----------------------------------------------------------+
| Eyebrow: Playbook · Field guide                            |
| H1 Fraunces (italic terracotta "playbook")  [Search][Read] |
| Italic lede                                                |
+-----------------------------------------------------------+
| Chapters · 6                          55 entries           |
| [01 W1 ✓ Planning] [02 W2 ● Messaging(active,dark)] ...    |
+-----------------------------------------------------------+
| Primary col (1.55fr)               | Sidebar (1fr)         |
|                                    |                       |
|  Featured pull-quote (clay-200)    |  What helps now (card)|
|  Section title (chapter)           |  Your pattern (ink)   |
|  Numbered entries 01 02 03 04      |  Up next (paper-200)  |
|  Footer "see all" link             |                       |
+-----------------------------------------------------------+
```

Mobile (`<md`):

```text
Title block
Chapters horizontal scroll (segmented, snap)
Featured quote (clay gradient)
Chapter section header
Entries card (white, hairline-divided rows)
"Your pattern" dark card
"Up next" row
Footer
```

We'll use Tailwind `hidden md:block` / `md:hidden` to show one or the other, both rendered inside `ProjectLayout`.

## Implementation steps

1. **Rewrite `src/pages/project/Playbook.tsx`** — replace current card-based render entirely:
   - Keep top-level data fetching (`usePlaybookData`, active phase query, `PHASE_WISDOM`, loading + empty states).
   - Update `PlaybookSkeleton` and `PlaybookEmptyState` to use the new editorial header look (eyebrow + Fraunces title) for visual consistency, but keep the wisdom-card list as the empty fallback.
   - Build small presentational subcomponents (in-file): `EditorialHeader`, `ChapterRail`, `FeaturedQuote`, `NumberedEntry`, `SidebarHelpsNow`, `SidebarPattern`, `SidebarUpNext`, `MobileChapterSegments`, `MobileEntries`, etc. Inline styles using CSS vars match mockups.
   - Compute `chapters` from a fixed 6-phase array, marking `done`/`active`/`upcoming` based on `currentPhase`.
   - Map `data.insights` → numbered entries; provide tag/headline/body/meta (split first sentence as headline, rest as body when insight text isn't pre-structured; tag = category label).
   - Drop the old `WisdomCard`, `InsightCard`, `PlaybookSection`, and `ReflectionPrompt` blocks (no longer in the design).
   - Remove unused lucide imports; keep `BookMarked`, `Search`, `ArrowRight`, `Check`, `Bookmark`, `Sparkles`, `ChevronRight`.

2. **No new files / no design-token changes** — all required CSS vars already exist.

3. **Routing untouched** — Playbook is already mounted at `/projects/:id/playbook` via existing route.

## Out of scope

- The mockups include a global app shell (top bar, bottom tab bar, sidebar). We already have `ProjectLayout` + `MobileTabBar`; we won't duplicate the mockup's nav. Only the page content area is rebuilt.
- No DB schema changes, no new hooks, no data semantics changes.
- The `ReflectionPrompt` ("Does this feel accurate?") block is removed since it isn't in the new design. If you want to keep it, say so and I'll tuck it under the footer.

## Acceptance check

- Desktop ≥1024px renders: editorial header, chapter rail (6 cards, active = ink-900), clay featured quote with terracotta accent and Apply/Save links, 4 numbered entries with terracotta italic numerals and hairline dividers, right sidebar (white card + ink card + paper card).
- Mobile <768px renders: Fraunces title block, horizontal-scrolling segmented chapters with snap, clay gradient featured quote, white rounded entries card with hairline rows, dark "Your pattern" card, "Up next" pill row, italic footer line.
- Loading and "not enough data" states still work and use the new header style.
