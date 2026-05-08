## Goal

The Add Habit drawer on mobile has two problems:
1. The big "Add habit" button at the bottom acts sticky/floating and covers fields when the keyboard opens.
2. When focusing the name field after closing the keyboard, the drawer collapses awkwardly (screenshot 1) instead of showing the form properly.

The Create Task sheet (`MobileAddTaskSheet`) already solves both of these. We'll rebuild the habit drawer to match its pattern.

## Changes (single file: `src/components/habits/mobile/MobileAddHabitDrawer.tsx`)

1. **Replace the shadcn `Drawer` with the same custom fixed-overlay pattern used in `MobileAddTaskSheet`:**
   - `position: fixed; inset: 0` container with a fade-in scrim and a translateY slide-up panel.
   - `maxHeight: 92%` panel, `borderTopLeftRadius/RightRadius: 28` (matches the task sheet, fixes the squared top corners issue).
   - Drag-handle pill at the top.
   - No `visualViewport` / keyboard-inset math — let the browser handle it like the task sheet does (it works correctly there).

2. **Move "Save" into the header (top-right), remove the bottom "Add habit" button entirely.**
   - Header layout: `Cancel` | `New habit / Edit habit` | `Save` (terracotta, bold), exactly like the task sheet.
   - This eliminates the sticky-button problem completely — there is no bottom button to be covered by the keyboard.

3. **Scroll body:** the WHEN / PAIR WITH / TAG sections and the AI nudge live inside the same `overflow-y: auto` scroller used in the task sheet, with normal bottom padding (no keyboard-conditional padding, no floating bar).

4. **Keep all existing habit fields and pickers intact:**
   - Name input card, Time of day, Cadence (+ custom days), Reminder, Pair with, Tag, Manage tags button, AI "I noticed" nudge, save logic — none of the form behavior or data model changes.
   - Remove the now-unused `fieldFocused`, `viewportKeyboardOpen`, `keyboardInset`, `visualHeight` state and the `visualViewport` effect.

5. **Delete-confirm dialog / ManageTagsDialog** stay as-is.

## Out of scope

- No backend / hook / data changes.
- No changes to `MobileAddTaskSheet` or shared `Drawer` primitive.
- No changes to the desktop habit dialog.

## Result

- Drawer top corners are rounded (28px) like every other sheet.
- Save lives in the header — never hidden by the keyboard.
- Focusing the name field no longer triggers the collapsed/floating-button layout from screenshot 1; the drawer behaves exactly like the create-task sheet.
