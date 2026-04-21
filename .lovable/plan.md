

## Finish the Task Detail editorial redesign

Building on the previous round, this finishes the two pieces I deferred: the right-hand side rail, and the editorial restyling of the form/inputs/buttons/footer.

### 1. Add the right-hand side rail (desktop only)

Convert the Task Detail layout from a single 760px column to a two-column grid on `lg+` (`grid-cols-[minmax(0,1fr)_300px] gap-12`), max width ~1140px. On mobile, the rail collapses below the main content.

**Rail contents (top to bottom, sticky `top-8`):**

1. **Phase progress strip** — small editorial card:
   - Eyebrow: "Phase {N} · {phaseLabel}"
   - Headline (display serif): the phase summary
   - Mono progress fraction `{completed}/{total}`
   - Thin terracotta progress bar (1px hairline track, terracotta fill)
   - Compact list of the 3–4 sibling tasks in this phase, current one bolded, completed ones with terracotta check mark

2. **Up next card** — uses `nextBestTask` already returned by `useTaskEngine`:
   - Eyebrow: "Up next"
   - Display-serif title (link to next task)
   - Mono time estimate + phase chip
   - Small terracotta "Open →" link

3. **Quiet reminder card** — dark `bg-ink-900 text-paper-100` rounded-2xl card:
   - Small italic display-serif quote about working "one quiet step at a time"
   - Subtle terracotta divider, then a one-line tip (rotates between 2–3 hard-coded reminders).

Pull data from existing hooks — `projectTasks`, `nextBestTask`, `taskTemplate.phase`, and the `PHASES` / `PHASE_LABELS` constants. No new queries needed.

### 2. Editorial restyling of the form area

Restyle in place inside the existing `Your response` section so all current logic, validation, AI assist, exports, and conditional renderings stay intact.

- **Section eyebrow**: replace `text-sm font-medium text-muted-foreground uppercase` headers with the existing `editorial-eyebrow` utility (already in `index.css`).
- **Inputs / Textareas / Selects**: wrap in a shared visual style — `bg-white border border-hairline rounded-2xl px-4 py-3 text-[15px] text-ink-900 placeholder:text-fg-muted focus:border-terracotta focus:ring-0`. Add a small className override; do not swap the underlying shadcn primitives.
- **Radio options** (path/option pickers): convert from default radio cards to editorial cards — `bg-white border border-hairline rounded-2xl p-5`, selected state = `border-terracotta bg-clay-100`, terracotta filled circle indicator on the left, display-serif title + body description.
- **Checklist items / completion criteria**: circular `border border-ink-300` checkbox with terracotta fill when checked, label in `text-[15px] text-ink-800`, struck-through label uses `text-fg-muted` (no harsh strikethrough color).
- **Export dropdown trigger**: convert to ghost pill `bg-white border border-hairline rounded-full px-3.5 py-1.5 text-[12.5px] text-ink-800` to match the "View phase snapshot" pill from the index page.

### 3. Bottom action area + "Still stuck?" footer

- **Save & mark complete button**: replace the default shadcn `<Button size="lg">` with a full editorial pill:
  - `bg-ink-900 text-paper-100 hover:bg-ink-800 rounded-full px-6 py-3 text-[14px] font-medium`
  - Disabled state: `bg-ink-100 text-fg-muted` with no hover
  - Loading state keeps the `Loader2` spinner
  - Caret arrow stays as `→`
- **"You're ready to save and continue!"** confirmation — restyle to `bg-moss-100 text-moss-700 border border-moss-500/20 rounded-2xl` with a moss `CheckCircle2`.
- **"Still stuck?" footer**: remove the centered layout, replace with the same gradient card pattern used at the bottom of `ProjectExecute.tsx`:
  - `rounded-2xl border border-hairline` with the cream→clay gradient
  - Left: small ink-900 circle icon (`HelpCircle` in `text-paper-100`)
  - Middle: display-serif "Stuck on this step?" + sans subtitle "Tell us where you're blocked and we'll point you forward."
  - Right: pill button `bg-ink-900 text-paper-100 rounded-full px-4 py-2.5` → opens existing `StuckHelpDialog` (logic unchanged).

### 4. Page background + container

Wrap the whole page in `bg-paper-100 min-h-screen` (already done) and update the inner container from `max-w-[760px]` to `max-w-[1140px]` with a two-column grid on `lg+`. The hero, "Why this matters", "What to do", and form sections all live in the left column. The rail sits in the right.

### Files to edit

- `src/pages/project/TaskDetail.tsx` — only file touched. All changes are JSX/className updates plus a new inline `<aside>` for the rail. No hook/data/logic changes, no new files.

