
# Redesign Social Planner to Time-Based Weekly Calendar

## Overview
Transform the Social Planner weekly view from vertical day columns into a full-page, time-based calendar grid matching the reference screenshot -- with hourly time slots on the left axis (12:00 AM through 11:00 PM) and days of the week across the top.

## Layout Changes

### Header (merged into one bar)
- Move the week navigation (arrows + "Today" button) and the month/year label into a single top bar alongside the action buttons ("Generate Launch Content", "Create Post")
- Remove the separate `PlanPageHeader` component to reclaim vertical space
- Remove the weekly/monthly toggle (keep only the new time-based weekly view; monthly view stays as-is but is accessed differently if needed)

### Time-Based Grid
- **Left column**: Hourly labels from 12:00 AM to 11:00 PM (24 rows), each row ~60px tall
- **Top header row**: Day names (Monday-Sunday) with date numbers; today's date gets a highlighted circle (like the screenshot)
- **Grid cells**: 7 columns x 24 rows, with light alternating row backgrounds and vertical/horizontal grid lines
- **Scrollable**: The grid scrolls vertically; on load, auto-scroll to ~8:00 AM so the user sees a useful time range
- Posts are positioned at their `scheduled_at` hour in the correct day column, displayed as compact chips showing platform icon + title

### Post Chips (in time slots)
- Compact pill/chip style matching the screenshot (platform icon + label like "Facebook Posts", "LinkedIn Posts")
- Platform-colored border or background tint
- If multiple posts overlap the same hour, stack them horizontally or show a "+N" overflow indicator
- Clicking a chip opens the post editor

### Full-Page Feel
- Remove the `max-w-7xl` container constraint from `ContentTab` so the calendar stretches edge-to-edge within the sidebar layout
- The calendar grid should fill the available viewport height (using `calc(100vh - header)` or flex-grow)

## Files to Change

### `src/components/content/ContentWeeklyView.tsx` -- Full rewrite
- Replace the current 7-column day layout with a time-based grid
- Add 24 hourly rows with time labels on the left
- Position posts in the correct hour/day cell based on `scheduled_at`
- Auto-scroll to current hour on mount
- Keep existing data fetching and event handlers

### `src/components/content/ContentTab.tsx` -- Simplify layout
- Remove `PlanPageHeader` for a more compact header
- Merge week nav + action buttons into one row
- Remove `max-w-7xl` constraint for full-width layout
- Keep the monthly view toggle but make weekly the default

### `src/pages/project/ProjectContent.tsx` -- Minor padding adjustment
- Ensure `ProjectLayout` doesn't add extra padding that constrains the calendar

## Technical Details

### Time slot positioning
- Parse `scheduled_at` to extract the hour (0-23) and map posts to the correct row
- Posts without a `scheduled_at` time won't appear on the time grid (only scheduled posts show)
- Each hour row is a fixed height (~60px), making the full grid ~1440px tall (scrollable)

### Auto-scroll to current time
- On mount, use a `useEffect` with `scrollIntoView` or `scrollTop` to center roughly on the current hour or 8:00 AM, whichever is more useful

### Post chip rendering
- Show platform icon (reuse existing `getPlatformIcon`) + truncated title
- If a post spans no specific duration, render as a single-row chip
- Multiple posts in same hour/day: render side-by-side within the cell, with "+N" if more than 2-3

### Responsive behavior
- On mobile, the grid scrolls horizontally (same pattern as current)
- Time labels column stays fixed/sticky on the left during horizontal scroll
