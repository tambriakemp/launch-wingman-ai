# Mobile/Native: Click-to-edit Subtasks + Task Autosave

Scope is mobile/native only — the existing desktop `PlannerTaskDialog.tsx` is left unchanged. All work is in `src/components/planner/mobile/MobileAddTaskSheet.tsx`.

## 1. Tap-to-edit subtask titles

In `SubtaskRow`, replace the read-only `<span>{subtask.title}</span>` with an inline editor:

- Tap the title text → swap to a borderless `<input>` (auto-focus, select-all on focus, `enterKeyHint="done"`).
- Commit on blur or Enter; Esc reverts.
- On commit: if changed and not empty, run `toTitleCase` and persist via `supabase.from("subtasks").update({ title }).eq("id", st.id)` — or update the local buffer when the parent task isn't saved yet (`_local`).
- Empty commit reverts to previous title (no destructive deletes from clearing the field).
- Pass an `onRename(st, newTitle)` callback from the parent so persistence stays alongside the existing `onToggle`/`onDelete` handlers.

## 2. Autosave for the mobile add/edit task sheet

Replace the explicit Save flow with debounced autosave. The header `Save` button is removed; `Cancel` becomes `Done` (just closes).

### New-task draft on open
- When the sheet opens in create mode, immediately call `onCreate({ title: "Untitled", column_id: "todo", task_type: "task", space_id: selectedSpaceId, ... })` to create a real row, store the returned id in local `draftId` state, and switch the sheet into "edit mode" against that id.
- If the user closes the sheet with the title still empty/`Untitled` and no other field touched, call `onDelete(draftId)` to clean up.
- Existing locally-buffered subtask logic (`_local`, `flushSubtasksForTask`) becomes unnecessary in this path — subtasks insert directly against `draftId`.

### Debounced field autosave
- Add a single `useEffect` that watches `[title, notes, spaceId, categoryId, priority, dueAt]` and, when an active task id exists (`editTask?.id` or `draftId`), debounces 600 ms then calls `onUpdate(id, payload)` with the same payload shape `handleSave` builds today.
- Skip the first run after open to avoid overwriting freshly-loaded values.
- Show a small "Saved" / spinner indicator in the header where Save used to be (subtle, non-blocking).
- Title validation: only autosave when `title.trim().length >= 1`; otherwise hold the write (still keep typing local).

### Cleanup
- Remove `handleSave`, the `submitting` state for save, and the `Save` button.
- Keep `handleAIParse` (it just sets local fields, which then autosave).
- Subtask add/toggle/delete already persist directly in edit mode — they'll now always have an id to attach to.

## Technical notes

- Reuse `toTitleCase` from `@/lib/utils` for both subtask rename and any title autosave.
- Debounce via a small inline `useRef<NodeJS.Timeout>` pattern; no new hook needed.
- Network failures during autosave: surface a non-intrusive `toast.error` (only once per failed batch) and retry on next change.
- No DB schema changes. No changes to `Planner.tsx`, `usePlannerSpaces`, or the desktop dialog.
- Memory `ux/design/ui-pattern-slide-out-panels` and `style/task-title-casing` continue to apply.

## Files touched

- `src/components/planner/mobile/MobileAddTaskSheet.tsx` — autosave loop, draft-on-open, header changes, `SubtaskRow` inline-edit + new `onRename` prop wiring.
