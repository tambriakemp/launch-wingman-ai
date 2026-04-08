

## Plan: Update Character Section — Remove Vibe Field, Add Clear Instructions

### What Changes

**File: `src/components/ai-studio/StoryboardToolbar.tsx`**

1. **Remove** the "Character Vibe / Lifestyle" textarea and its label/helper text (lines 167–176).

2. **Replace** the current instruction line (line 151) with a clearer two-option layout:

```
<div className="space-y-1 mb-3">
  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Choose your character source</p>
  <p className="text-xs text-muted-foreground leading-relaxed">
    <strong className="text-foreground">Option A — Saved Character:</strong> Select a character you've already built. Their photos and profile will be applied automatically.
  </p>
  <p className="text-xs text-muted-foreground leading-relaxed">
    <strong className="text-foreground">Option B — Upload New Photo:</strong> Upload a reference photo or selfie. This will be used as the face reference or start image for your vlog, UGC, or carousel.
  </p>
</div>
```

3. Update the divider text between SavedCharacter and UploadZone from `"or upload new"` to `"or upload a new photo"`.

4. Update UploadZone subtext to: `"Use as a face reference or the start image of your content."`.

### Files Modified
- `src/components/ai-studio/StoryboardToolbar.tsx` — remove vibe textarea, update character section instructions

