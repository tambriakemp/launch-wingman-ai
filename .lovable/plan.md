
Plan: fix the black-screen behavior on the last scene regeneration from the frontend side first.

What I found
- The image-generation backend is not the current failure point: the last `generate-scene-image` request returned `200` with a valid `imageUrl`, and the function logs show successful image generation.
- That means the “black screen” is most likely a UI state issue in the scene viewer, not the image function itself.
- The most suspicious areas are:
  1. `SceneCard.tsx` fullscreen/overlay behavior while regenerating
  2. `ImageLightbox.tsx` showing a full-screen black layer
  3. `StudioStoryboard.tsx` returning `null` if the current scene/media temporarily goes missing
- There is also a React ref warning in `SceneCard` that should be cleaned up because it adds noise while debugging.

Implementation plan
1. Harden the scene image panel
- Only allow enlarge/lightbox behavior when a valid image actually exists.
- Disable zoom/open interactions while a scene is regenerating or if the scene has no loaded image yet.
- Keep the user on the same scene with a clear inline loading/error state instead of letting the UI fall into a black overlay state.

2. Make the lightbox fail-safe
- Update `ImageLightbox.tsx` so it never renders as a full black fullscreen layer without a valid image.
- If the selected scene has no image, show a proper fallback panel or auto-close instead of leaving the screen black.
- Add guards for out-of-range indexes and missing `generatedMedia[index]`.

3. Make storyboard rendering resilient
- In `StudioStoryboard.tsx`, replace the current `if (!step || !media) return null;` with a safer fallback UI.
- Clamp the current scene index not only against `storyboard.steps.length`, but also against available media entries when needed.
- This prevents the main workspace from disappearing during state transitions on the last scene.

4. Improve regeneration state handling in `AIStudio.tsx`
- Preserve the existing scene card state more safely while a replacement image is being generated.
- Ensure the last scene does not briefly enter a missing/undefined render state during `setGeneratedMedia` updates.
- Add a stricter success path so the new image replaces the old one cleanly and clears loading flags in all cases.

5. Clean up the noisy warning in `SceneCard.tsx`
- Remove the ref-related warning path around `EditableField` so console output is cleaner and future runtime errors are easier to spot.
- This is not the black-screen root cause, but it is worth fixing in the same pass.

Technical details
- Files likely to update:
  - `src/pages/AIStudio.tsx`
  - `src/components/ai-studio/SceneCard.tsx`
  - `src/components/ai-studio/StudioStoryboard.tsx`
  - `src/components/ai-studio/ImageLightbox.tsx`
- No backend/database changes are planned for this fix because runtime evidence currently shows the image function is succeeding.
- I will treat this as a render-state and interaction-guard issue, not a generation-timeout issue.

Verification
- Regenerate scene 4 specifically.
- Confirm the request still returns `200` and the scene updates in place.
- Confirm no fullscreen black layer appears.
- Confirm the last-scene card remains visible during loading, success, and error states.
- Confirm image zoom still works normally when a valid image is present.