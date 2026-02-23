

## Add Padding and Border Radius to Social Planner Weekly Calendar

### What Changes
Add visual containment to the weekly calendar grid so it has rounded corners and padding, similar to the Munch Studio reference screenshot.

### File: `src/components/content/ContentWeeklyView.tsx`

**Wrap the calendar grid area** (header bar + day headers + scrollable time grid) in a container with:
- `rounded-xl` border radius
- `border border-border` for a subtle outline
- `overflow-hidden` to clip the grid corners
- The outer div gets a small padding (`p-2` or `p-3`) so the rounded card sits inset from the edges

Specifically, change the root div from:
```
<div className="flex flex-col h-full">
```
to:
```
<div className="flex flex-col h-full p-3">
  <div className="flex flex-col flex-1 overflow-hidden rounded-xl border border-border bg-card">
```

Then close the new inner wrapper at the end. The existing `bg-card` classes on header/day-header rows remain, but the outer container now provides the rounded shape.

### Files Modified
1. `src/components/content/ContentWeeklyView.tsx` -- add outer padding and inner rounded border container
