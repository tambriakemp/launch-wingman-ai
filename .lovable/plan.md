

## Plan: Improve Character Consistency & Feed Cohesion Prompts

### Problem
1. When "Use reference as start image" is enabled, subsequent scenes lose character details (hair, jewelry, makeup, outfit) because the backend doesn't know Scene 1 is the unmodified reference photo — it generates prompts without anchoring to it.
2. Storyboard prompts lack the ultra-detailed, iPhone-native, feed-cohesion style the user wants (as shown in the ChatGPT example prompts).

### Changes

---

**1. `supabase/functions/generate-storyboard/index.ts` — Enhance storyboard generation prompts**

- Pass `config.useReferenceAsStart` into the storyboard generation logic.
- When `useReferenceAsStart` is true, add instructions telling the AI:
  - Scene 1 IS the reference photo — the AI must analyze it exhaustively and describe every detail (skin tone, bone structure, hair style/color/part, jewelry pieces, nail shape/color, makeup, outfit fabric/color/fit/neckline) as the canonical identity lock.
  - All subsequent scenes must repeat this full description verbatim in every `image_prompt`.

- For **both vlog/carousel modes**, upgrade the storyboard system prompt to require ChatGPT-quality image prompts:
  - Each `image_prompt` must include: full character description (skin, face, hair, makeup, accessories, nails, outfit), environment description, lighting direction, camera lens/settings ("shot on iPhone 15 Pro Max"), and the anti-smoothing/realism clause.
  - Add a `FEED COHESION` section requiring: same color palette, same lighting session feel, varied shot types (hero, waist-up, close-up beauty, macro detail, flat lay, environment-only, candid movement, alternate angle).
  - Require each prompt to specify shot type explicitly and include the full identity lock block.

- Add a `SHOT PALETTE` instruction for vlog mode similar to the carousel one — requiring a mix of wide/medium/close-up/detail/environment shots for feed variety.

---

**2. `supabase/functions/generate-scene-image/index.ts` — Strengthen identity lock in image generation**

- When `config.useReferenceAsStart` is true AND `sceneNumber > 1`, add an extra identity lock paragraph:
  ```
  IDENTITY LOCK FROM REFERENCE (CRITICAL): Scene 1 is the UNMODIFIED reference photo. 
  You MUST reproduce EXACTLY: same skin tone, same bone structure, same hair (style, color, part, length), 
  same jewelry (every ring, necklace, earring, bracelet), same nail shape and color, same makeup 
  (brow shape, shadow color, lip color, lash style, contour placement, highlighter). 
  The outfit must be PIXEL-PERFECT identical unless the scene explicitly calls for a change.
  ```

- Add the iPhone realism clause to ALL prompts (not just when `ultraRealistic` is toggled), as a lighter version:
  ```
  natural skin texture, visible pores, subtle imperfections, no smoothing, no plastic skin, 
  realistic fabric folds, natural highlight roll-off, true-to-life colour balance, 
  razor sharp eye detail, visible lash separation, clean hairline edge definition
  ```

---

**3. `supabase/functions/generate-storyboard/index.ts` — Vlog shot variety instructions**

Add to the vlog system prompt a `SHOT VARIETY FOR FEED COHESION` block:
```
SHOT VARIETY FOR FEED COHESION (CRITICAL):
Vary shots across this spectrum — each scene uses a DIFFERENT framing:
- Full body hero shot (establishing, confident, environment visible)
- Waist-up variation (different interaction, subtle expression change)
- Close-up beauty portrait (tight on face, intense or soft expression)
- Macro detail shot (hands, nails, jewelry, product, texture)
- Flat lay / environment-only (no person — props, setting, ambient mood)
- Candid movement (mid-turn, walking, reaching, laughing — motion blur okay)
- Alternate angle (low angle, over-shoulder, reflection, profile)

Each image_prompt MUST specify the exact shot type and framing.
Each image_prompt MUST include the FULL character description block 
(skin, face, hair, makeup, jewelry, nails, outfit) repeated verbatim.
```

---

### Files to Modify
- `supabase/functions/generate-storyboard/index.ts` — add useReferenceAsStart awareness, upgrade prompt quality, add shot variety instructions
- `supabase/functions/generate-scene-image/index.ts` — add identity lock clause for reference-as-start, add baseline realism clause

No database changes needed.

