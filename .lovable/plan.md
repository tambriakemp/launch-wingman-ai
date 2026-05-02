# Match Calendar to Editorial Design

The current Planner page already has the right header structure but diverges from the mockup in five concrete ways: the page background is grey (not warm cream), there's no top breadcrumb / "Synced with Google Calendar" strip, the week view is a 46-column horizontal scroller instead of a clean 7-column grid for the visible week, task cards use space colors rather than the source-based palette (Launch/Social/Goal/Habit/Personal/AI), and the right-hand rail (week intent, progress, focus mix, "Tambra suggests") is missing entirely.

This plan brings the `/planner` Week view into 1:1 alignment with the uploaded mockup. Month and List views stay as they are.

## What changes

### 1. Page chrome — `src/pages/Planner.tsx`
- Switch the outer container background to the editorial paper tone (`bg-[hsl(var(--paper-200))]`) so the cards float on cream.
- Add a sticky top strip above the editorial header containing:
  - Left: `Planner / Calendar` breadcrumb (muted → bold).
  - Right: "Synced with Google Calendar" moss-tinted pill (only when `useCalendarSync().hasConnections === true`).
- Keep the existing `WEEK 18 · MAY 2026` eyebrow + large italic `May 2 — 8` heading and the right-side `Today` pill / `Week · Month · List` toggle / `+ New event` button — adjust spacing only to match the mockup (header on `paper-100`, hairline border underneath).

### 2. Week board — replace 46-column scroller with 7-column grid
- New behaviour: Week view always renders the 7 days of the currently anchored week (Mon–Sun via `startOfWeek`/`endOfWeek`). Prev/Next shifts by 7 days; "Today" jumps to today's week.
- Edit `src/components/planner/PlannerWeekBoardView.tsx`:
  - Accept `days: Date[]` (length 7) instead of `startDate` + `dayCount`.
  - Render a `grid-cols-7 gap-3` layout (no horizontal scroller, no scroll-to-today logic).
  - Day column styling:
    - Card: `bg-[hsl(var(--paper-100))]`, hairline border, `rounded-xl`, `p-3`.
    - Today column: `bg-[hsl(var(--terracotta-500)/0.04)]` + terracotta bottom border on the header.
    - Weekend column: very faint warm tint.
  - Day header: large italic Fraunces date number (`font-serif italic text-3xl`), uppercase `SAT/SUN/...` next to it, italic "today" sub-label only on today.
  - Group tasks into `All-day` block then timed block. Empty state: italic serif "A clear page."
  - Bottom "+ Add" button: full-width dashed hairline border, muted text → terracotta on hover.

### 3. Source-based task cards
The mockup colors cards by **source** (Launch/Social/Goal/Habit/Personal/AI), not by Space.
- Add a small `getSourceFromTask(task)` helper in `PlannerWeekBoardView.tsx` that maps:
  - `task_type === "habit"` or column `habit` → **Habit** (moss)
  - `space_id` matches a "Launch" / project space → **Launch** (plum) — fallback rule: any task tied to the active project space
  - Category name containing "social"/"post"/"carousel" → **Social** (terracotta)
  - Category/space "goal" → **Goal** (clay)
  - Category/space "ai" → **AI** (terracotta-soft)
  - Default → **Personal** (ink)
- Build a `SOURCE_HUES` map mirroring the mockup (bg / fg / dot tokens off `--terracotta-500`, `--moss-500`, `--plum-700`, `--clay-200`, `--ink-800`).
- Card layout per the mockup:
  - White (`bg-card`) with hairline border + 3px left border in source dot color.
  - Top row: mono `9:00 AM · 45m` (or uppercase tracked "ALL DAY") on the left, square checkbox on the right (filled with dot color when complete).
  - Title in body font, line-through + 0.55 opacity when complete.
  - Footer: source pill `• Launch` style (dot + label, soft tinted bg).
- Remove the current space/category chip cluster from the card; the source pill replaces it.

### 4. Right-hand week rail (new)
Create `src/components/planner/PlannerWeekRail.tsx`:
- Width 280, sits to the right of the 7-column grid (hidden under `lg`).
- Sections, all derived from the visible week's filtered tasks:
  1. **THIS WEEK IS FOR** eyebrow + italic Fraunces sentence. Source = the current project's `weekly_intent` field if present, else a graceful fallback ("Plan your week, schedule your day.").
  2. **Done this week** card on `paper-100`: `completed/total`, terracotta progress bar, large italic `XX%` + "into the week".
  3. **Where your week is going**: one row per source, source pill + thin progress bar (count / total) + count.
  4. **Tambra suggests** dark card (`bg-[#1F1B17]`, terracotta radial glow, `Yes, do it` / `Not now` buttons). For now this is a static placeholder identical to the mockup; wiring to a real suggestion engine is out of scope.

### 5. Planner page wiring
- In `Planner.tsx`, compute `weekStart` (already exists) and pass `days = [0..6].map(i => addDays(weekStart, i))` to `PlannerWeekBoardView`.
- Mount `PlannerWeekRail` to the right of the board only when `sunsamaView === "board"`.
- Drop the unused `BOARD_DAY_COUNT` / `scrollToTodayNonce` plumbing.

## Out of scope
- Month and List views are not redesigned in this pass (they were polished in a prior round).
- No DB schema changes; "source" is derived client-side from existing fields.
- The `Tambra suggests` card is presentational only.

## Technical notes
- All new colors come from existing CSS vars in `src/index.css` (`--terracotta-500`, `--moss-500`, `--plum-700`, `--clay-200`, `--ink-800/900`, `--paper-100/200`, `--border-hairline`). No tailwind config changes required — use arbitrary `hsl(var(--...))` classes.
- `PlannerWeekBoardView` loses `startDate`, `dayCount`, `scrollToTodayNonce`, `useLayoutEffect` scroll logic, and `expandAllRecurring` window math (still expand, but bound to `days[0]`–`days[6]`).
- Keep drag-and-drop intact; droppable IDs remain `yyyy-MM-dd`.
- The "Synced with Google Calendar" pill reuses `useCalendarSync().hasConnections`.
