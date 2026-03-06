

# Planner UI Upgrade — Calendar Cleanup + Modern Modal

## Overview
1. Remove the unscheduled/overdue sidebar from Calendar view; show unscheduled tasks as a collapsible list below the calendar grid.
2. Redesign the PlannerTaskDialog to match the reference screenshot style — cleaner layout with icon header, date picker + time pickers (start/end always visible), and a more polished visual treatment.
3. Start/end date+time fields always shown in the modal (not conditionally hidden).

---

## Changes

### 1. PlannerCalendarView — Remove sidebar, add bottom unscheduled list
**File: `src/components/planner/PlannerCalendarView.tsx`**

- Remove the `lg:flex-row` split layout with the right sidebar (Unscheduled + Overdue sections).
- Calendar grid takes full width.
- Below the calendar grid, add a collapsible "Unscheduled Tasks" section showing unscheduled items in a compact list with task title, category badge, and click-to-edit. Include count badge in the header.
- Remove the Overdue sidebar section entirely (overdue is already shown in List view).

### 2. PlannerTaskDialog — Visual upgrade inspired by reference
**File: `src/components/planner/PlannerTaskDialog.tsx`**

- Add an icon in the dialog header (CalendarCheck icon with themed background, matching the reference "Create Schedule" modal style).
- Always show Start and End datetime fields (not conditionally based on task type). This makes scheduling intuitive for all items.
- Replace the current "Due Date" calendar popover + separate datetime-local inputs with a cleaner layout:
  - **Date** field: date picker (single date for the day)
  - **Start Time** / **End Time**: time inputs side by side with a dash separator
- Keep Type, Category, Status, Description, Location fields.
- Style the Cancel/Submit buttons to match the reference (outline Cancel, primary Continue/Create).
- Add `pointer-events-auto` to the Calendar component per the shadcn datepicker guidelines.

### 3. Minor polish across views
- **PlannerListView**: No structural changes needed (already clean).
- **PlannerBoardView**: No changes needed.
- **Planner.tsx**: No changes needed (already wires everything correctly).

---

## Files to Modify
- `src/components/planner/PlannerCalendarView.tsx` — remove sidebar, add bottom unscheduled list
- `src/components/planner/PlannerTaskDialog.tsx` — visual redesign with always-visible date/time fields

