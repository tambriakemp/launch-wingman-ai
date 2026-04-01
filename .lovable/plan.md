

## Fix Projects Button — Wider Dropdown Arrow + Color Contrast

### Problem
The Projects button's dropdown arrow portion (`px-1.5`) is too narrow and visually cramped. The arrow blends in with the button because it uses the same `bg-foreground text-background` colors.

### Changes

**`src/components/ai-studio/StoryboardToolbar.tsx`** (lines 527-549)

1. **Widen the dropdown arrow area**: Change `px-1.5` to `px-2.5` so the chevron has more breathing room.
2. **Differentiate the arrow color**: Use a slightly lighter/different background for the arrow portion — e.g. `bg-foreground/80` instead of `bg-foreground`, so it reads as a distinct clickable zone while still looking connected to the Projects button.
3. **Always show the rounded-r-lg on the Projects button group**: When there's no dropdown (no storyboard), the Projects button should use full `rounded-lg` instead of `rounded-l-lg`. Currently it uses `rounded-l-lg` always and adds a `w-px` spacer when no dropdown — fix this so it rounds properly.

### Result
- The dropdown arrow is wider and visually distinct (slightly lighter shade).
- The button no longer looks cut off.
- When no storyboard exists, Projects renders as a normal fully-rounded button.

