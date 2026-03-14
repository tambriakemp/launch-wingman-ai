

# Add Top 3 Priorities & Habits Widgets to Calendar Sidebar

## Overview
Add two new sidebar widgets below "Upcoming" in the Calendar view:
1. **Top 3 Priorities** — Shows today's priorities from the `daily_pages` table, allows checking them off
2. **Habits** — Shows active habits from the `habits` table, allows toggling completions for today

Both widgets reuse the same data sources and toggle logic already implemented in `DailyPage.tsx`.

## Changes

### `src/components/planner/PlannerCalendarView.tsx`
- Import `useAuth`, `supabase`, `useCallback`, `useEffect` from existing dependencies
- Add state for priorities (`daily_pages` data) and habits (`habits` + `habit_completions`)
- Fetch today's `daily_pages` row for priority_1/2/3 and their done states
- Fetch active habits and today's completions
- Add toggle handlers for priorities (upsert to `daily_pages`) and habits (insert/delete `habit_completions`)
- Render two new widget sections in the left sidebar after "Upcoming":

**Top 3 Priorities widget:**
- Header: "TODAY'S PRIORITIES" (matching existing uppercase style)
- List up to 3 priorities with checkbox circles
- Clicking toggles `priority_X_done` in the `daily_pages` table
- If no priorities set, show "Set priorities on Daily Page" with a link

**Habits widget:**
- Header: "HABITS"
- List all active habits with their color dot and checkbox
- Clicking toggles the completion for today (same logic as DailyPage)
- If no habits, show "No habits yet"

Both widgets use the same visual patterns as the existing Upcoming section (compact text-xs styling, rounded-lg hover states).

## Technical Details
- Priorities are stored in `daily_pages` table with columns: `priority_1`, `priority_1_done`, `priority_2`, `priority_2_done`, `priority_3`, `priority_3_done`
- Habit completions use `habit_completions` table with `habit_id`, `user_id`, `completed_date`
- The upsert for daily_pages uses `onConflict: "user_id,page_date"` (existing pattern)
- Data fetches on component mount; toggles update local state optimistically then persist

