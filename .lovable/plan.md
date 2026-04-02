

## Redesign Planner List View to ClickUp-Style Task List

### Changes

**`src/pages/Planner.tsx`**
- Rename tab label from "List" to "Tasks"
- Add a "+ Task" button in the header area (visible when on Tasks tab)

**`src/components/planner/PlannerListView.tsx`** — Major redesign:

1. **Remove "All clear for today" message** (lines 93-100)

2. **ClickUp-style table header row** — Add a sticky header with columns: Name, Due Date, Category, Status (like ClickUp's column headers with muted text)

3. **Redesign TaskRow to be ClickUp-style:**
   - Compact row height (~36px) with tighter padding
   - Checkbox on left, task name inline, then columns for due date, category, status aligned in a table-like grid
   - Hover reveals action buttons (edit, delete)
   - Status shown as a colored badge (TO DO, IN PROGRESS, DONE)

4. **Add "+ Add Task" row at bottom of each group** — clicking opens the task dialog (like ClickUp's inline add)

5. **Group headers styled like ClickUp** — colored status dot + label + count badge, compact height

### Technical approach
- Use CSS grid or flex with fixed column widths to create the table-like layout without an actual `<table>`
- Keep the existing grouping logic (overdue, today, this week, anytime, completed)
- Wire the new "+ Add Task" rows to the existing `onAddTask` callback

### Result
A dense, ClickUp-inspired task list with column headers, compact rows, inline add buttons, and no empty-state filler messages.

