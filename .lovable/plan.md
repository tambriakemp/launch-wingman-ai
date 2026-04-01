

## Clean Up AI Studio Toolbar Layout

### Summary
Consolidate the busy toolbar into a minimal layout. Remove the "New" button (the "Create" button will handle new projects implicitly). Group secondary actions into a dropdown menu to reduce visual clutter.

### Current state (toolbar buttons when a storyboard exists)
`[Create] | [Save] [Script] [All] ... [Projects] [New]`
Plus below that, a second row of batch actions:
`[Generate All Images] [Generate All Videos] [Create Reel] [View Reel]`

That is up to 9+ visible buttons. Too busy.

### Proposed layout

**Top toolbar — 3 visible items max:**
```text
[Create]  [Save]  ···  (overflow menu)              [Projects]
```

- **Create** stays as-is, opens the Sheet. When clicked with an existing storyboard, the Sheet always opens. If the user changes settings and hits "Generate Storyboard", it resets the current workspace (like `confirmNewProject` does) and generates fresh. This eliminates the need for a separate "New" button.
- **Save** stays prominent (only shown when storyboard exists).
- **Overflow "..." menu** (DropdownMenu) contains: Download Script, Download All, Help. These are infrequently used.
- **Projects** stays on the right side.
- **Remove** the yellow "New" button entirely.

**Batch actions row (below, when storyboard exists):**
```text
Storyboard · N scenes     [Gen All Images] [Gen All Videos] [Reel ▾]
```

- Collapse "Create Reel" and "View Reel" into a single dropdown button labeled "Reel" with menu items: "Create Reel" / "Re-create Reel", "View Reel", "Download Reel".

### Changes

**`src/components/ai-studio/StoryboardToolbar.tsx`**
1. Remove the "New" button and its `onNew` prop usage from the toolbar.
2. Change the "Generate Storyboard" button to always show (remove `!hasStoryboard` condition). When there IS an existing storyboard, the button label changes to "Generate New Storyboard" and calls a combined reset-then-generate flow.
3. Replace the inline "Script" and "All" download buttons with a `DropdownMenu` triggered by a `MoreHorizontal` icon button.
4. Keep only `[Create] [Save] [···] ——— [Projects]` in the top bar.

**`src/pages/AIStudio.tsx`**
1. Remove `onNew` prop from `StoryboardToolbar` usage.
2. Update `handleGenerateStoryboard` (or add a wrapper) so that if a storyboard already exists, it first runs `confirmNewProject`-style reset (clear storyboard, media, project ID, etc.), then proceeds with generation. This makes "Create > change settings > Generate" the implicit "new project" flow.
3. Collapse the reel buttons ("Create Reel", "View Reel") into a single `DropdownMenu` in the batch actions row.
4. Remove `showResetConfirmation` dialog since the explicit "New" button is gone. The reset now happens automatically when re-generating.

### Technical details
- Use `DropdownMenu` from `@/components/ui/dropdown-menu` for the overflow menu and reel menu.
- The `onNew` prop and `showResetConfirmation` state/dialog can be fully removed.
- The "Generate Storyboard" button in the Sheet should always be visible. When `hasStoryboard` is true, show "Generate New Storyboard" with a brief inline warning like "This will replace your current storyboard."

