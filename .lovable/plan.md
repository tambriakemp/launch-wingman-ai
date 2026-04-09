

## Problem

The prompt editing and regeneration are disconnected in the UI. The SceneCard has two independent interactions:
1. **Edit mode**: textarea with Save/Cancel buttons — updates `editedPrompt` local state, only writes to storyboard on explicit Save click
2. **Regenerate button**: the refresh icon on the image overlay — reads from the storyboard (which still has the OLD prompt if Save wasn't clicked)

The user edits the prompt, removes "martini glass," then clicks Regenerate directly — but since they didn't click Save first, the storyboard still contains the original prompt with the martini glass reference.

## Fix

**File: `src/components/ai-studio/SceneCard.tsx`**

Auto-save any pending prompt edits when the user clicks Regenerate. Two changes:

1. Wrap `onGenerateImage` so that if the prompt is being edited (`isEditing === true`) and the edited text differs from the step's current prompt, call `onUpdatePrompt(editedPrompt)` first, then trigger generation.

2. Same treatment for video prompt: if `isEditingVideo` and the user triggers video generation, auto-save the video prompt first.

This way the user can edit the prompt and click Regenerate in one natural flow without needing to remember to click Save.

**File: `src/components/ai-studio/StudioStoryboard.tsx`**

No changes needed — the queue processor already reads from `storyboardRef.current`, so once the prompt is saved to the storyboard state, the latest version will be picked up.

### Technical detail

In SceneCard, create a helper:
```text
const handleGenerateWithAutoSave = () => {
  if (isEditing && editedPrompt !== step.image_prompt) {
    onUpdatePrompt(editedPrompt);
    setIsEditing(false);
  }
  onGenerateImage();
};
```

Replace all `onGenerateImage()` calls in SceneCard with `handleGenerateWithAutoSave()` — this covers the Generate button (empty state), Retry button (error state), and Regenerate overlay icon.

Note: there's a React timing concern — `onUpdatePrompt` triggers `setStoryboard`, but the ref update happens in a `useEffect` after render. Since `onGenerateImage` also triggers `setQueue` in the same synchronous call, both state updates are batched in the same render, and the ref-sync useEffect (which appears before the queue-processor useEffect) will run first. So the prompt will be updated in the ref before the queue processes it.

