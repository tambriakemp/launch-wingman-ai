

# Planner Calendar UI Overhaul — Weekly View Inspired by Reference

## What Changes

The current calendar is a basic **monthly grid** with tiny task chips. The reference shows a polished **weekly view** with hourly time slots, colored event cards positioned by time, and a clean header with day columns. This is a significant redesign of `PlannerCalendarView.tsx`.

### New Calendar Layout

**Header area:**
- Month/year title (bold, left-aligned) with date range subtitle
- Week navigation arrows (prev/next week)
- "Today" button to snap back to current week

**Weekly grid:**
- 8 columns: time gutter (left) + 7 day columns (Sun-Sat)
- Day column headers show day name + date number, with today highlighted in primary color
- Time gutter shows hours from 6 AM to 10 PM
- Hourly rows with light horizontal dividers
- Current time indicator (colored horizontal line with dot)

**Event cards:**
- Positioned absolutely within day columns based on `start_at`/`end_at` times
- Height proportional to duration
- Colored backgrounds (primary tint for events, accent for tasks)
- Show title + time range (e.g., "09:00 AM - 10:30 AM")
- Click to edit
- Rounded corners, subtle shadow

**Clicking empty time slot:**
- Opens create dialog with date + approximate time prefilled

**Unscheduled tasks:**
- Keep collapsible section below the weekly grid (already implemented)

### Monthly view toggle
- Add a small "Weekly / Monthly" toggle in the calendar header
- Weekly is the default (matches reference)
- Monthly keeps the existing grid as a fallback

---

## Files to Modify

### `src/components/planner/PlannerCalendarView.tsx` — Full rewrite
- Replace monthly grid with weekly time-slot grid as default view
- Add week navigation (prev/next week, today button)
- Render events as positioned cards within day columns
- Calculate card top position and height from start_at/end_at times
- Add current time indicator line
- Keep monthly view as secondary toggle option
- Keep unscheduled collapsible section at bottom

### `src/pages/Planner.tsx` — No changes needed
- Already passes correct props

### `src/components/planner/PlannerTaskDialog.tsx` — No changes needed
- Already styled per previous update

---

## Technical Details

**Time-to-pixel mapping:**
```
const HOUR_HEIGHT = 60px
const START_HOUR = 6 (6 AM)
const END_HOUR = 22 (10 PM)

topPx = (taskHour - START_HOUR) * HOUR_HEIGHT + (taskMinute / 60) * HOUR_HEIGHT
heightPx = durationMinutes / 60 * HOUR_HEIGHT
```

**Week calculation:**
- Use `startOfWeek(currentDate, { weekStartsOn: 0 })` for Sunday start (matching reference)
- `eachDayOfInterval` for the 7 days
- Navigation: `addWeeks` / `subWeeks`

**Event positioning:**
- Day columns use `position: relative`
- Event cards use `position: absolute` with calculated `top` and `height`
- Overlapping events: simple offset (not full overlap handling for MVP)

