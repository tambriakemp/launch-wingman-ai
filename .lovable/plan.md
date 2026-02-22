

## Fix: Progress Bar Still Showing Green

### Root Cause
The `Progress` component has a hardcoded `bg-primary` class on its indicator. When `indicatorClassName` passes `bg-muted-foreground/30`, Tailwind Merge should override it, but the teal/green color is still bleeding through. The fix is to remove the default `bg-primary` from the Progress component and let the caller always control the color via `indicatorClassName`.

### Changes

**File: `src/components/ui/progress.tsx` (line ~21)**

Remove `bg-primary` from the indicator's default classes so it becomes:
```
className={cn("h-full w-full flex-1 transition-all", indicatorClassName)}
```

This ensures no default green/teal color is applied -- the color is fully controlled by the `indicatorClassName` prop passed from the parent.

**File: All other usages of `<Progress />`**

Search for any other `<Progress />` usage that relies on the default `bg-primary` color and add an explicit `indicatorClassName="bg-primary"` to those instances so they keep working as before.

