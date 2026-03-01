

## Persistent Side-by-Side Layout with Initial Scene Card

### What Changes

Replace the current flow (hidden storyboard until generation) with an always-visible two-column layout:

```text
+------------------------------------------------------------------+
| Header + Toolbar (unchanged, full width)                         |
+----------------------------+-------------------------------------+
|  LEFT COLUMN (~40%)        |  RIGHT COLUMN (~60%)                |
|                            |                                     |
|  [Vlog Category dropdown]  |  IMAGE PREVIEW                      |
|  [Topic / UGC textarea]    |  (empty placeholder until generated)|
|  [Brainstorm button]       |  (shows preview image after gen)    |
|                            |                                     |
|  --- divider ---           |  VIDEO PANEL                        |
|                            |  (Generate Video button, player)    |
|  [Image Prompt field]      |                                     |
|  (auto-filled from topic   |                                     |
|   or manually entered)     |                                     |
|                            |                                     |
|  [Generate Preview btn]    |                                     |
|  [Generate Storyboard btn] |                                     |
+----------------------------+-------------------------------------+
| Bottom Action Bar                                                |
+------------------------------------------------------------------+
```

### How It Works

1. **On page load**: A single "initial scene card" is always visible in the side-by-side layout. Left side has the topic/prompt fields. Right side has empty image + video placeholders.

2. **User enters vlog topic** in the left column (no longer buried in Settings popover).

3. **User clicks "Generate Preview"** (small button in the left column). The character preview generates and displays in the right column's image panel.

4. **From there, the user can either**:
   - Click "Generate Video" on the right side to make a video from just this one preview
   - Click "Generate Full Storyboard" to expand into the multi-scene storyboard view

5. **After storyboard generation**: The layout stays the same but now has scene navigation (prev/next, dots) and the left column shows the current scene's prompt/script details.

### File Changes

**`src/pages/AIStudio.tsx`** (major restructure of the main content area)
- Remove the separate "Inline Character Preview Bar" section (lines 676-725)
- Remove the "No storyboard yet" empty placeholder (lines 756-761)
- Replace with a persistent two-column grid layout that is always visible
- Left column: Vlog category, topic textarea, brainstorm button, divider, prompt field, "Generate Preview" button, "Generate Full Storyboard" button
- Right column: Image panel (preview placeholder or generated image) + Video panel below it
- When storyboard exists, the left column shows per-scene prompts/script and the right column shows scene images with navigation
- Move vlog category/topic out of the Settings popover into the left column

**`src/components/ai-studio/StoryboardToolbar.tsx`**
- Remove the vlog category, vlog topic, and brainstorm controls from the Settings popover (they now live permanently in the left column)
- Keep remaining Settings items: creation mode, camera movement, script, safety terms

**`src/components/ai-studio/StudioStoryboard.tsx`**
- Refactor to accept and render within the two-column layout instead of being a standalone block
- The scene navigation (prev/next, dots) moves to the left column or stays below

### Technical Approach

- Use a simple CSS grid (`grid grid-cols-[minmax(320px,2fr)_3fr]`) for the two columns rather than resizable panels, keeping it simpler
- The left column scrolls independently with `overflow-y-auto` and a max height
- The right column maintains the aspect ratio panels for image and video
- State for "initial scene" before storyboard generation uses a default VlogStep with empty prompts that get filled from the topic
- The "Generate Preview" button calls the existing `handleGeneratePreview` function
- The "Generate Full Storyboard" button calls the existing `handleGenerateStoryboard` function

