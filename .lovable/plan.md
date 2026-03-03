

## AI Studio Toolbar Cleanup

### 1. Aspect Ratio: Convert to Dropdown with Icons

Replace the 3-button toggle group with a compact dropdown (Popover) that shows an icon representing each ratio alongside the label.

- Portrait (9:16): `RectangleVertical` icon -- set as the default
- Landscape (16:9): `RectangleHorizontal` icon  
- Square (1:1): `Square` icon

The trigger button shows the currently selected ratio's icon + label + chevron, matching the same style as the other toolbar popovers (Character, Environment, etc.).

**File:** `src/components/ai-studio/StoryboardToolbar.tsx` (lines 116-124)

### 2. Save Button: Black Style, Only After Storyboard

- Change the Save button styling from ghost/outline to a solid black background (`bg-foreground text-background`)
- Conditionally render it only when `hasStoryboard` is true (move it inside the existing `hasStoryboard` conditional block alongside Script and All)

**File:** `src/components/ai-studio/StoryboardToolbar.tsx` (lines 319-321)

### 3. Remove Help Button, Add Inline Instructions and Tooltips

**Remove:**
- The Help (`?`) button from the toolbar (line 332-334)
- Remove `onHelp` prop usage (keep the prop for backward compat but stop rendering the button)

**Add inline instructions under the header:**
- In `AIStudio.tsx`, add a short instruction line under the header subtitle: *"Upload a character, configure your look, then generate your storyboard. Lock icons on images keep consistency across scenes."*
- Style as `text-xs text-muted-foreground` below the existing subtitle

**Add tooltips to consistency lock icons:**
- Find where the lock icons are rendered on storyboard scene cards and wrap each with a tooltip explaining its purpose:
  - Character Lock: "Lock this face as the master reference for all scenes"
  - Outfit Lock: "Lock this outfit to keep clothing consistent"  
  - Environment Lock: "Lock this background for scene consistency"

**Files:**
- `src/components/ai-studio/StoryboardToolbar.tsx` -- remove Help button
- `src/pages/AIStudio.tsx` -- add instruction text under header
- `src/components/ai-studio/SceneCard.tsx` (or wherever lock icons live) -- wrap lock icons with Tooltip components

### Technical Details

**Orientation dropdown** in StoryboardToolbar.tsx:
```tsx
// Replace button group with a Popover dropdown
const ASPECT_OPTIONS = [
  { value: '9:16', label: 'Portrait', icon: RectangleVertical },
  { value: '16:9', label: 'Landscape', icon: RectangleHorizontal },
  { value: '1:1', label: 'Square', icon: Square },
];
```

**Save button** conditional + styling:
```tsx
{hasStoryboard && (
  <>
    <button onClick={onSave} disabled={isSaving}
      className="... bg-foreground text-background hover:bg-foreground/90 ...">
      Save
    </button>
    <button onClick={onDownloadScript}>Script</button>
    <button onClick={onDownloadAll}>All</button>
  </>
)}
```

**Inline instructions** in AIStudio.tsx header:
```tsx
<p className="text-xs text-muted-foreground mt-1">
  Upload a character, configure your look, then generate. 
  Use lock icons on images to keep consistency across scenes.
</p>
```

