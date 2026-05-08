## Goal

Rebuild the Habit Tracker to match the Launchely editorial mockups exactly (warm cream canvas, terracotta accent, Fraunces display + Inter Tight body), and add the new features shown in the mockups: habit pairing, streak shields, Sunday review, AI nudges, 26-week heatmap, and in-content tabs on desktop. Mobile web and native (Capacitor) get the iOS-style design with bottom-sheet add habit, swipeable rows, haptics, and local notifications.

## What changes

### 1. Database (migration)
- `habits`: add `pair_with_habit_id uuid`, `tag text` (for Care/Body/Mind/Rhythm/Launch), `reminder_time time`.
- New `habit_streak_shields`: `id, user_id, habit_id, used_date, month_key text` — 1 free shield per user per month, used to forgive a missed scheduled day.
- New `habit_reviews`: `id, user_id, week_start date, summary text, ai_suggestion text, dismissed_at` — Sunday review snapshots.
- RLS: owner-only on all three.

### 2. Theme (scoped to habits screens)
- New `src/styles/habits-theme.css` defining CSS vars (`--hb-cream`, `--hb-ink`, `--hb-terracotta`, `--hb-sage`, `--hb-plum`, `--hb-amber`, `--hb-paper`, `--hb-line`, heat scale) and `@font-face` for Fraunces + Inter Tight (Google Fonts). Imported once from a top-level `<HabitsThemeShell>` wrapper. No global token changes.

### 3. Desktop redesign — `/habits` (single route, in-content tabs)
Tabs inside content: **Today / Habits / Statistics / Add habit**. Wrapped in `ProjectLayout` (sidebar context preserved per memory rule).
- **Today**: editorial greeting, week pill strip, AI "Pattern noticed" card (terracotta), grouped habit rows (Morning / All day / Evening) with check rings; right column: "Today's rhythm" donut, "Best streak" + shield card, "Today's chain" timeline.
- **Habits**: cream table with color bar, name + pair-with italic, time-of-day, cadence, streak (flame), 7-day dot row, edit icon. Drag-to-reorder (DnD via `@dnd-kit/sortable`).
- **Statistics**: 4 KPI tiles, 26-week heatmap (computed from `habit_completions`), per-habit 7-day grid with streak.
- **Add habit**: 2-column form with editorial pills for time/cadence/tag, pair-with picker, reminder time, live preview card on the right, AI nudge.

`/habits/stats` route kept as redirect to `/habits?tab=stats` for back-compat.

### 4. Mobile web redesign (responsive — same `/habits` route, < md breakpoint)
Renders the iOS-style `MobileToday` / `MobileStats` / `MobileReview` layouts shown in the mockup. Bottom-sheet `MobileAddHabit` opened by floating FAB. Day strip, time-of-day groups, AI nudge inline, terracotta progress card.

### 5. Native features (Capacitor — already installed)
- **Haptics**: tap-to-toggle row (`light` impact), Save habit (`success` notify) via `@capacitor/haptics`.
- **Local notifications**: schedule a daily reminder per habit at `reminder_time` using `@capacitor/local-notifications`. Reschedule on save/edit/delete; permissions prompt on first habit with reminder.
- **Status bar**: cream tint on light pages, ink tint on Sunday Review screen via `@capacitor/status-bar`.
- **Safe areas**: respect `env(safe-area-inset-*)` for FAB and sheets.
- Web fallback: skip native modules behind `Capacitor.isNativePlatform()` checks (already used elsewhere via `useIsNativeApp`).

### 6. New / changed files

```text
supabase/migrations/<ts>_habits_redesign.sql

src/styles/habits-theme.css                       (new)
src/lib/habits/heatmap.ts                         (compute 26-week grid from completions)
src/lib/habits/streakShield.ts                    (current-month shield helpers)
src/lib/habits/notifications.ts                   (Capacitor schedule/cancel)

src/components/habits/HabitsThemeShell.tsx        (font + css var wrapper)
src/components/habits/desktop/DesktopTabs.tsx
src/components/habits/desktop/TodayView.tsx
src/components/habits/desktop/HabitsTableView.tsx
src/components/habits/desktop/StatsView.tsx
src/components/habits/desktop/AddHabitView.tsx
src/components/habits/mobile/MobileToday.tsx
src/components/habits/mobile/MobileStats.tsx
src/components/habits/mobile/MobileReview.tsx
src/components/habits/mobile/MobileAddHabitSheet.tsx
src/components/habits/shared/HabitRowEditorial.tsx
src/components/habits/shared/Heatmap.tsx
src/components/habits/shared/AINudgeCard.tsx
src/components/habits/shared/PairWithPicker.tsx
src/components/habits/shared/StreakShieldBadge.tsx
src/components/habits/shared/SundayReviewBanner.tsx

src/pages/HabitTracker.tsx                        (rewritten — picks desktop/mobile)
src/pages/HabitStats.tsx                          (redirect → /habits?tab=stats)
src/pages/HabitReview.tsx                         (new — /habits/review)
src/App.tsx                                       (add /habits/review route)
```

Existing `HabitGrid`, `HabitStatsRow`, `HabitDetailSheet`, `HabitDialog` are deprecated and removed (their data shape lives on in the new components).

### 7. AI nudges (Lovable AI Gateway, `google/gemini-2.5-flash`)
Edge function `generate-habit-nudge` — input: recent 14d completions + active habits → output: short nudge text + optional suggested action. Cached client-side per day. Sunday review uses same function with `mode: "weekly"`.

### 8. Out of scope
- Drag-reorder of habit groups on Today (only Habits table is reorderable).
- Push notifications via web push (only native local notifications).
- Editing the global app theme — habit theme stays scoped.

## Acceptance
- `/habits` matches mockup pixel-for-pixel at 1440 desktop and 390 mobile.
- Toggling a habit row gives haptic feedback on iOS/Android builds.
- Reminders fire at configured `reminder_time` after `npx cap sync`.
- 26-week heatmap reflects real `habit_completions` data.
- Streak shield can be claimed once per calendar month and forgives a single missed scheduled day in streak math.
- Sunday review screen accessible via `/habits/review`, auto-banner appears on Today between Sun 6am and Mon 6am.
