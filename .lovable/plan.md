

## Improve Campaign Period Display

The current "Campaign Period" line is plain muted text that blends into the background. Here's how to make it feel more intentional and integrated with the header design:

### Changes (single file: `CampaignDetailHeader.tsx`)

**Replace the plain text line with a styled inline element:**

- Add a `Calendar` icon (from lucide-react) before the label for visual consistency with the sidebar cards
- Use a subtle separator dot between the label and the dates
- Style the dates themselves with `font-medium text-foreground` so they stand out from the "Campaign Period" label, which stays muted
- Display "Ongoing" with a small green dot indicator instead of plain text, to signal an active/open-ended campaign
- Wrap the whole thing in a `flex items-center gap-2` row so it sits cleanly on one line beneath the title

**Before:**
```
Campaign Period: 02-22-2026 → Ongoing
```

**After (visually):**
```
[calendar icon]  Campaign Period  ·  02-22-2026 → Ongoing [green dot]
```

### Technical Details

- Import `Calendar` from `lucide-react`
- Replace lines 115-124 with a flex row containing:
  - `Calendar` icon (`w-3.5 h-3.5 text-muted-foreground`)
  - "Campaign Period" label (`text-xs text-muted-foreground uppercase tracking-wide font-medium`)
  - A middle-dot separator
  - The formatted date range (`text-sm font-medium text-foreground`)
  - If end date is null, render "Ongoing" with a small pulsing green dot beside it
- No other files change

