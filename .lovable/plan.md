## Move Add button further below the habit list

The button still appears just under the list because the page content is short and doesn't scroll, so the `sticky bottom-6` value never engages — the button sits at its natural position right after the list with only `mt-32` (128px) of spacing.

### Change

In both `src/pages/HabitTracker.tsx` (line ~304) and `src/pages/HabitStats.tsx` (line ~221):

- Change the wrapper's top margin from `mt-32` to `mt-[400px]` to push the Add button ~400px below the last list item.
- Keep `sticky bottom-6` so once the page does grow tall enough to scroll, the button still pins 24px above the viewport bottom.
- Keep `flex justify-center` so it stays horizontally centered on the content column (already correctly aligned with the list above it).
- No other changes — the button itself, sizing, color, and click behavior stay identical.

That's it — single class swap on each of the two files.