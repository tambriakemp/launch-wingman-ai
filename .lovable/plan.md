

## Improve Section Separation & Update "Set the Scene" Section

### Summary
Make each collapsible section in the slide-out panel visually distinct, increase textarea heights for the scene description fields, and rename the last section.

### Changes — single file: `src/components/ai-studio/StoryboardToolbar.tsx`

**1. Better section separation in `CollapsibleSection` component (lines 71-87)**
- Add `bg-muted/30 rounded-lg px-4 mt-2` background to each section wrapper so sections have card-like separation
- Add slightly more vertical padding to the trigger
- Remove the `divide-y` on the parent container (line 124) since sections now stand alone as cards

**2. Parent container spacing (line 124)**
- Change `space-y-1 divide-y divide-border` to `space-y-3` so sections have breathing room between the cards

**3. Rename section title (line ~340)**
- Change the last section title from `"📝 Setting & Message"` (or whatever the current label is) to `"🎬 Set the Scene"`

**4. Increase carousel textarea heights (lines 391-404)**
- Change `min-h-[60px]` on "Scene Description" textarea to `min-h-[140px]` (~6 lines)
- Change `min-h-[50px]` on "Story / Caption Theme" textarea to `min-h-[140px]` (~6 lines)
- Also increase the vlog topic textarea and UGC textarea to `min-h-[140px]` for consistency

