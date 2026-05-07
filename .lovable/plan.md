## Habit Tracker Redesign

Replace the current month-grid Habit Tracker with a 3-screen experience inspired by the screenshots, styled in our modern design system (semantic tokens, rounded cards, subtle borders — not the dark/glossy look of the reference). Applies to mobile/native AND desktop.

### Screens

**1. Today view** (`/habits`, default)
- Sticky header: "Habits" title + settings/add button
- Horizontal day strip (7 days, today centered, tap to switch active day; swipe on mobile)
- Time-of-day tab pills: All Day · Morning · Afternoon · Evening
- Habit list grouped by selected slot:
  - Each row: colored icon tile, name, motivational subtitle, optional duration chip on right (e.g. "15m")
  - Tap row → toggle complete (haptic on native); long-press / chevron → open Detail
- Empty state per slot
- Floating "+" button (bottom-center) to create new habit

**2. Habit Detail sheet**
- Right-side Sheet on desktop, full-screen sheet on mobile
- Big icon + name + description
- Editable rows: Frequency (Every day / Specific days), Duration per day (minutes), Time-of-day slots (Morning/Afternoon/Evening), Reminder times (chips with add/remove)
- Tabs: **Statistics** (current streak, completion-rate ring, last-7-days dots) | **Notes** (free-text per habit)
- Delete button in header (uses standard DELETE-typed confirmation)

**3. Statistics page** (`/habits/stats`)
- Tabs: **Summary** | **Habits**
- Summary tab:
  - Productivity card: today's % done across all habits (semicircular gauge), motivational copy, mini trend chart, donut of Done/Skipped/To-Do
  - Streaks card: best current streak, last-7-days dots
- Habits tab: per-habit row with streak + 30-day completion %

### Navigation
- Mobile bottom tab bar gets a "Habits" affordance only when on `/habits/*` routes (not adding to global tab bar)
- In-page sub-nav: "Today" / "Stats" segmented control at top of `/habits`

### Schema changes (single migration)
Add to `public.habits`:
- `time_of_day text[]` default `'{}'` — values: `morning|afternoon|evening|all_day`
- `duration_minutes int` nullable
- `reminder_times text[]` default `'{}'` — `HH:MM` 24h strings
- `notes text` nullable

No RLS changes (existing policies cover new columns).

### Files

New:
- `src/components/habits/HabitTodayView.tsx` — day strip + slot tabs + list
- `src/components/habits/HabitRow.tsx`
- `src/components/habits/HabitDayStrip.tsx`
- `src/components/habits/HabitSlotTabs.tsx`
- `src/components/habits/HabitDetailSheet.tsx` — replaces current HabitDialog usage
- `src/components/habits/HabitStatsSummary.tsx`
- `src/components/habits/HabitStatsHabits.tsx`
- `src/components/habits/ProductivityGauge.tsx`
- `src/pages/HabitStats.tsx` (route `/habits/stats`)

Modified:
- `src/pages/HabitTracker.tsx` — swap grid for HabitTodayView, add segmented Today/Stats nav
- `src/components/habits/HabitDialog.tsx` — extend with new fields (time_of_day, duration, reminders) OR replaced by HabitDetailSheet
- `src/App.tsx` — add `/habits/stats` route
- DB types regenerate automatically after migration

### Design system
- Use `bg-card`, `border-border`, `text-foreground`, `text-muted-foreground`, `bg-primary/10` etc. — no hardcoded colors
- Habit color used only as small accent dot / icon tile background tint
- Rounded-2xl cards, generous spacing, no glossy/dark theme
- Reuse `Sheet`, `Tabs`, `Button`, `Progress` from shadcn

### Out of scope
- Achievements / challenges (locked tiles in screenshots)
- Push reminder delivery wiring (just storing reminder_times for now)
- Mobile bottom tab bar additions