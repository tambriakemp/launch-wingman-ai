

## Fix: Progress Bar Track is Green (Root Cause Found)

### Root Cause

The green color is **not** coming from the indicator -- it's from the **track** (the container/background of the progress bar).

In `src/components/ui/progress.tsx`, the progress bar root has class `bg-secondary`. In your theme, `--secondary` is defined as `168 76% 42%` which is a **teal/green** color. So the progress bar background itself is green, making the whole bar appear green regardless of the indicator color.

### Solution

Override the track color on the Goal card's `<Progress>` by passing a neutral background via the `className` prop:

**File: `src/components/campaigns/CampaignDetailSidebar.tsx` (line 121)**

Change from:
```tsx
<Progress value={goalPct} className="h-1.5" indicatorClassName={...} />
```

To:
```tsx
<Progress value={goalPct} className="h-1.5 bg-muted" indicatorClassName={...} />
```

This overrides the `bg-secondary` track with `bg-muted` (a neutral gray), so the track is gray and the indicator fills with color only when progress occurs. The `bg-emerald-500` indicator at 100% will still pop on the neutral track.

No other files need changes -- this is a single-line fix targeting the specific Progress instance in the Goal card.
