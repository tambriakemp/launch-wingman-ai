
What I found

- This is no longer a frontend “missing image” bug.
- The logs show the new scene 4 URL is returned successfully, written into state, and the browser reports the image loaded successfully:
  - `[AIStudio] Scene 4 image response: ...`
  - `[AIStudio] Updating media state for scene 4...`
  - `[SceneCard] Image loaded OK: ...`
- The session replay also shows the new image URL gets applied to both the scene card and the lightbox.
- Your screenshot matches that: the app is rendering an image container with controls, but the actual rendered asset is visually black.
- The backend logs show this request used the `flux_kontext` path, so the most likely issue is the generated/stored image itself is bad for this regeneration path, not that the UI failed to display it.

Plan

1. Treat this as a generation-quality / asset-validation issue
- Update `generate-scene-image` so complex scene regenerations do not use the Flux edit path when the request depends on multiple references, continuity, or environment fidelity.
- Prefer the multimodal image model for these cases, since it can actually use the full reference set already being assembled in `contentParts`.

2. Add hard validation before accepting a regenerated image
- In `generate-scene-image`, log:
  - chosen model path
  - returned provider URL
  - fetch status/content-type for the generated asset
  - byte length before upload
- If the provider returns a non-image, empty asset, or suspiciously bad fetch result, automatically fall back to the Gemini path instead of uploading/replacing the scene.

3. Preserve the previous image until the replacement is proven usable
- In `AIStudio.tsx`, do not immediately replace the existing scene image with the new URL.
- First preload the candidate image.
- Only swap it into `generatedMedia` after it loads successfully.
- If preload fails, keep the old image visible and show an explicit error toast instead of replacing it with a bad output.

4. Add a stronger fallback for “black output” cases
- If Flux is selected for regenerate/edit and the result looks invalid from transport-level checks, rerun with Gemini automatically.
- Also tighten model-routing rules so Flux is skipped for:
  - later scenes with continuity chaining
  - environment reference scenes
  - Path A identity-locked scenes
  - final-look transitions

5. Clean up the unrelated React ref warnings
- Fix the `EditableField` / `ImageLightbox` ref warning noise so future debugging is clearer.
- This is not the black-image root cause, but it is cluttering the console.

Files to update

- `supabase/functions/generate-scene-image/index.ts`
- `src/pages/AIStudio.tsx`
- optionally `src/components/ai-studio/ImageLightbox.tsx` and/or `SceneCard.tsx` only for minor cleanup, not as the main fix

Technical notes

- The current evidence points away from the UI:
  - state update succeeded
  - `<img>` `onLoad` fired
  - replay shows the new `src` applied
- The weak point is the generated replacement asset itself.
- A likely contributor is that the Flux branch only edits from a single `baseFluxImage`, while the Gemini branch can use the full multimodal reference set. That mismatch is especially risky for scene 4 regeneration where continuity and environment matter.

Verification

- Regenerate scene 4 again after the fix.
- Confirm logs show either:
  - Gemini chosen directly for that request, or
  - Flux attempted, rejected, then Gemini fallback used.
- Confirm the old image stays visible during regeneration.
- Confirm the new image replaces it only after successful preload.
- Confirm no all-black replacement appears in the scene card or lightbox.
