

## Plan: Debug and fix black-screen on scene 4 regeneration

### Root cause analysis

The edge function logs confirm the image generates successfully and uploads to storage. The issue is on the frontend. Looking at the SceneCard rendering logic, there are two likely causes:

1. **Broken image URL with no fallback**: When `media.imageUrl` is truthy (set to a URL), the `<img>` tag renders. If that URL fails to load (expired, 404, CORS), the image shows nothing — just the dark `bg-muted` background. There is no `onError` handler to detect this.

2. **State update not applying**: The `setGeneratedMedia` call after successful generation might be getting overwritten or not triggering a re-render properly, leaving the media in a state where `imageUrl` is undefined but `isGeneratingImage` is also false — resulting in an empty div with no visible content.

### Changes

#### 1. Add image load error handling in SceneCard (`SceneCard.tsx`)
- Add an `imageBroken` local state, reset when `media.imageUrl` changes.
- Add `onError` handler to the `<img>` tag that sets `imageBroken = true` and logs the broken URL.
- When `imageBroken` is true, render the empty state (Generate Image button) instead of the broken `<img>`.
- Add `onLoad` handler that logs successful load for debugging.

#### 2. Add console logging in the queue processor (`AIStudio.tsx`)
- Log the `data.imageUrl` returned from the edge function before calling `setGeneratedMedia`.
- Log inside the `setGeneratedMedia` updater to confirm the state is being set.
- Log after the catch block to confirm no silent errors.

#### 3. Defensive state handling (`AIStudio.tsx`)
- In the `setGeneratedMedia` success updater (line ~215), add a guard: if `data.imageUrl` is falsy, log an error and don't clear the previous image.
- Ensure the loading state (`isGeneratingImage`) is always cleared in both success and error paths, even if the response is malformed.

### Files to modify
- `src/components/ai-studio/SceneCard.tsx` — image error handling + fallback
- `src/pages/AIStudio.tsx` — debug logging + defensive state updates

