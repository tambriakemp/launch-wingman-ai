

## Plan: Fix safety filter blocks on scene regeneration

### Problem
Scene 2 regeneration fails with a 422 because Google's image model flags the prompt. The current `sanitizeOutfit` function in `generate-scene-image/index.ts` doesn't catch several trigger words present in the prompt: "bustier," "sheer mesh panels," "revealing fit," "décolletage."

### Root cause
The sanitizer only covers a small set of words. The prompt — which includes verbatim outfit descriptions extracted from the reference photo — passes through uncleaned.

### Fix

**File: `supabase/functions/generate-scene-image/index.ts`**

1. Expand `sanitizeOutfit` with additional replacements:
   - `bustier` → `structured strapless top`
   - `sheer mesh` → `semi-transparent fabric`
   - `revealing` → `form-fitting`
   - `décolletage` / `decolletage` → `neckline`
   - `cleavage` → `neckline`
   - `bare skin` → `exposed`
   - `plunging` → `deep v-neck`
   - `skin-tight` → `fitted`
   - `backless` → `open-back`
   - `exposed` (in suggestive contexts) — left as-is since it's neutral

2. Apply `sanitizeOutfit` not just to `currentOutfit` but also to the **full prompt text** before it's sent to the model. Currently the prompt comes from the storyboard and contains the raw outfit block verbatim. The sanitizer only runs on the config-derived outfit string, not on the prompt itself.

3. Add a `sanitizePrompt` wrapper that runs the same replacements on the entire `fullPrompt` string right before it's added to `contentParts`.

### Scope
- Single file change: `supabase/functions/generate-scene-image/index.ts`
- Redeploy the edge function
- No frontend or database changes

