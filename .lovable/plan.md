

# Planner Page Redesign — Screenshot-Matching Layout

## Overview

Complete redesign of the Planner page to match the attached screenshot: a dark left sidebar with mini calendar, upcoming event card, list view, and categories — paired with a full-width week calendar in the main area. Remove header, search, add button, board view, and unscheduled column.

## Layout

```text
┌─────────────────┬──────────────────────────────────────────────┐
│  Dark Sidebar    │  Main Calendar Area                         │
│  (~280px)        │  (flex-1, full width)                       │
│                  │                                              │
│ [User avatar +   │  "March, 2026"   [Month|Week|Day]  < Today >│
│  name/role]      │                                              │
│                  │  Sun    Mon    Tue    Wed    Thu    Fri   Sat │
│ Mini Calendar    │   1      2      3      4      5      6    7  │
│ [July grid]      │                                              │
│                  │  6am ┌──────┐ ┌──────┐                      │
│ [Upcoming event  │      │Event │ │Event │  (colorful cards)    │
│  card w/ Later   │  7am │      │ └──────┘                      │
│  + Details btns] │      └──────┘                                │
│                  │  8am                                         │
│ ▼ My List        │  ...time grid continues...                   │
│   (PlannerList   │                                              │
│    embedded)     │                                              │
│                  │                                              │
│ ▼ Categories     │                                              │
│  ● Personal      │                                              │
│  ● Work          │                                              │
│  ● Health        │                                              │
└─────────────────┴──────────────────────────────────────────────┘
```

## Files to Modify

### 1. `src/pages/Planner.tsx` — Major rewrite

**Remove:**
- Page header (icon, title, description)
- Search input
- Add dropdown button
- Tabs component (Calendar/List/Board tabs)
- Board view import and usage
- `searchQuery` state and filtering

**New structure:**
- Remove `<div className="px-6 py-8 space-y-6">` wrapper — go full-screen with `h-[calc(100vh-...)]` or `flex-1 overflow-hidden`
- Render `PlannerCalendarView` directly as the only view, passing all task data and handlers
- Pass `tasks` (unfiltered, no search), list-related handlers, and `isLoading` to the calendar view
- The calendar view itself will contain the embedded list in the sidebar

**Pass new props to `PlannerCalendarView`:**
- `onDeleteTask`, `onAddTask`, `isLoading` (for the embedded list)

### 2. `src/components/planner/PlannerCalendarView.tsx` — Full rewrite

**Props update:**
- Add `onDeleteTask`, `onAddTask`, `isLoading` props

**Left Sidebar (dark themed — `bg-gray-900 dark:bg-gray-950 text-white`):**

1. **User profile area** (top): Show user avatar placeholder + "My Calendar" label with small calendar icon badge (matching screenshot aesthetic)

2. **Mini calendar**: Keep existing shadcn `<Calendar>` but restyle for dark background (white text, dark cells, primary highlight on selected date)

3. **Upcoming event card**: Show the next upcoming scheduled event/task in a styled card with:
   - Time range + duration badge
   - Title + location
   - "Later" and "Details" action buttons
   - Small decorative illustration area (use a subtle gradient or icon)

4. **"My List" section** (replaces "My Calendars"):
   - Collapsible section header with chevron
   - Embed a compact version of `PlannerListView` inside (pass tasks, handlers)
   - Or render a simplified inline list showing task title + checkbox + category dot

5. **"Categories" section**:
   - Keep existing category toggles (Personal/Work) 
   - Add "Health" category with pink/red dot
   - Each category shows a small horizontal progress bar (matching screenshot)

**Main Calendar Area:**

1. **Header**: Match screenshot exactly:
   - Left: Large "March, 2026" text
   - Center: Month | Week | Day pill toggle (Week active by default, Day can be placeholder)
   - Right: `<` prev, "Today" button (prominent), `>` next

2. **Day headers**: Large, prominent — day name on top, large date number below. Current day gets a dark/primary rounded background on the number. Match screenshot styling with rounded pill backgrounds.

3. **Week time grid**: Keep existing logic but enhance card styles:
   - Cards use richer, more saturated pastel colors matching screenshot (green, blue, yellow, purple, pink)
   - Cards show: title (bold), time range below, optional avatar circles
   - Rounded corners (rounded-xl), slightly more padding
   - Remove the thin border style, use stronger background fills

4. **Remove**: Right sidebar / unscheduled column entirely

**Color palette for event cards** (matching screenshot):
- Green: `bg-emerald-100 text-emerald-800` (like "Booking taxi app")
- Blue/Lavender: `bg-blue-100 text-blue-800` (like "Design session")  
- Yellow/Amber: `bg-amber-100 text-amber-800` (like "Development meet")
- Purple: `bg-purple-100 text-purple-800` (like "Design Review")
- Pink: `bg-pink-100 text-pink-800`

**Responsive**: On mobile/small screens, sidebar collapses or stacks above.

### 3. No database changes needed

All existing data model and queries remain the same.

