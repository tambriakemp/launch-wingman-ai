
Deep dive findings

- This is now primarily an edge-function / upstream generation reliability problem, not a frontend render bug.
- The logs show `generate-scene-image` is failing because the image provider returns `503`, and the function then throws `Image generation failed: 503`.
- The biggest reason this keeps happening is that the code is sending very heavy, redundant requests to Gemini while also forcing Gemini for the exact scenes that are hardest to generate.

Why it keeps failing

1. Complex regenerations are forced onto Gemini
- In `supabase/functions/generate-scene-image/index.ts`, `useFlux` is disabled whenever the request is considered “complex”:
  - scene > 1
  - final look
  - previous scene image exists
  - environment images exist
  - reference-as-start on later scenes
- Your logs confirm this path: `Model: gemini (complex scene, forced gemini)`.
- Those are also the scenes most likely to need stronger identity consistency and most likely to overload Gemini.

2. The same reference image is being sent multiple times
- For later scenes, the function can push:
  - `anchorImageUrl`
  - `previewCharacter`
  - `previousSceneImageUrl`
- In scene 2, those can all point to the same image.
- That means the provider gets duplicate image inputs plus a huge text prompt, which increases request weight without adding useful signal.

3. The text prompt is extremely large and safety-sensitive
- The request body includes a very long identity block plus scene instructions, realism rules, continuity rules, outfit description, and sometimes alcohol references like “martini glass”.
- This creates two failure modes:
  - `422` safety blocks
  - `503` transient failures from a heavier request
- The current sanitization helps, but it is still reactive and incomplete.

4. Some continuity data is sent but not actually used
- `previousScenePrompt` and `nextScenePrompt` are sent from the client, but `generate-scene-image` does not use them.
- So the payload grows, but the function is not getting real continuity value from those fields.

5. Retry logic is too shallow
- Current logic retries Gemini only twice with 2s/4s backoff.
- If the provider is briefly unstable, the function still returns a hard failure instead of degrading gracefully.
- There is also no model failover after repeated Gemini `503`s.

What I would change

1. Fix request construction first (`supabase/functions/generate-scene-image/index.ts`)
- Deduplicate image inputs before building `contentParts`.
- Keep only:
  - one canonical identity image
  - one previous-scene continuity image if it is different
  - only the minimum environment references needed
- Stop sending redundant copies of the same photo.

2. Change model routing
- Remove the blanket “complex scene => force Gemini” rule.
- Preferred behavior:
  - use the selected model when available
  - if Gemini returns repeated `503`s, fall back to Flux when a key exists
  - or prefer Flux for continuity-heavy scene regenerations since that is where consistency matters most

3. Shrink and structure the prompt
- Reduce repeated instructions in `fullPrompt`.
- Keep the strongest constraints, but remove duplicated realism/identity language.
- Make continuity instructions tighter and shorter.
- This lowers both safety risk and provider load.

4. Harden safety handling
- Sanitize the prompt before the first request more aggressively for known trigger terms.
- Normalize alcohol / suggestive fashion language earlier, not only after a safety hit.
- Return clear `422` responses consistently instead of letting some provider failures become generic `500`s.

5. Improve resilience for transient failures
- Expand retry strategy with better backoff.
- Add model fallback after repeated `503`s.
- Longer-term: move image generation to a queued job flow so the edge function can return quickly and a worker can handle retries more safely.

6. Clean up unused payload
- Since `previousScenePrompt` and `nextScenePrompt` are not used, either:
  - remove them from the client request, or
  - actually use them inside the function for continuity guidance.
- For stability, I would remove them first.

Files to update

- `supabase/functions/generate-scene-image/index.ts`
  - dedupe images
  - revise model selection
  - reduce prompt size
  - improve safety handling
  - add stronger retry/fallback behavior
- `src/pages/AIStudio.tsx`
  - stop sending unused continuity fields unless they are truly consumed
  - improve surfaced error messaging for 422 vs 503

Technical conclusion

- The failures are not random.
- They are the result of:
  - forcing the heavier scenes onto Gemini,
  - sending oversized/redundant multimodal payloads,
  - shallow retry logic,
  - and incomplete safety/error handling.
- So the real root cause is “provider instability amplified by our request construction and routing logic.”

Verification after the fix

- Regenerate scene 2 and scene 4.
- Confirm logs no longer show duplicate identity images being attached.
- Confirm the selected image model is actually used for complex regenerations, or that fallback occurs after Gemini `503`.
- Confirm safety-filter failures return a clean `422` message.
- Confirm transient provider failures recover without breaking the scene.
- Confirm later-scene identity consistency improves because continuity requests are lighter and routed more appropriately.
