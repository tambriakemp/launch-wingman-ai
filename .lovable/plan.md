

## Subtasks + ClickUp-Style Task Panel Redesign

### Overview
Redesign the `PlannerTaskDialog` slide-out panel to match ClickUp's layout: wider panel, two-column field grid at the top, large title + description area, and a subtasks section with full CRUD. Clicking a subtask opens its own detail panel.

### Changes

**1. Widen the Sheet panel**
- `PlannerTaskDialog.tsx`: Change `sm:max-w-[480px]` → `sm:max-w-[720px]`

**2. ClickUp-style two-column field layout**
Replace the current stacked single-column fields with a compact two-column grid inspired by the uploaded screenshots:

```text
┌─────────────────────────────────────────────────┐
│  [Task Title - large, editable]                 │
│                                                 │
│  ┌─────────────────┬───────────────────────┐    │
│  │ ⊙ Status   Open │ 📁 Space    Personal  │    │
│  │ 📅 Dates  Start→Due │ 🏷 Category  Work  │    │
│  │ 🔄 Repeat  None │                       │    │
│  └─────────────────┴───────────────────────┘    │
│                                                 │
│  [Description - textarea, "Add description..."] │
│                                                 │
│  ── Subtasks (2/5) ─────────────────── [+] ──── │
│  ☑ Subtask one                          ⋯      │
│  ☐ Subtask two                          ⋯      │
│  [+ Add subtask input]                          │
│                                                 │
│  ─────────────────── Footer ─────────────────── │
│  [Unschedule]              [Cancel] [Save]      │
└─────────────────────────────────────────────────┘
```

Fields rendered as inline rows (icon + label + value) in a `grid-cols-2` layout, similar to ClickUp's property grid.

**3. Add Subtasks section**
Reuse the existing `subtasks` database table (already has RLS). Add to `PlannerTaskDialog`:
- Fetch subtasks when editing a task (`supabase.from("subtasks").select("*").eq("task_id", editTask.id)`)
- Display as a checklist with toggle, inline edit, delete via `...` menu
- "Add subtask" input at bottom with Enter to submit
- Show progress indicator: "Subtasks (completed/total)"
- Only show subtasks section when editing (not creating — need a task ID first)

**4. Subtask detail panel**
When a subtask title is clicked, open a nested Sheet (or replace the current content with a "drill-down" view):
- Show subtask title (editable), completed toggle, created date
- Back button to return to parent task
- Keep it simple — title, status, and a description field (add `description` column to subtasks table via migration)

**5. Database migration**
Add `description` column to `subtasks` table:
```sql
ALTER TABLE public.subtasks ADD COLUMN description TEXT DEFAULT NULL;
```

### Files to modify
- `src/components/planner/PlannerTaskDialog.tsx` — Major redesign: wider panel, two-column fields, subtasks section, subtask detail drill-down
- Database migration for `subtasks.description` column

### Files to create
- None — all changes contained in the existing dialog component (subtask detail is a nested view within the same Sheet)

