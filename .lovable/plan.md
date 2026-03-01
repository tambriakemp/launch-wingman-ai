

## Fix GRWM Character Consistency: Root Cause and Solution

### Deep Analysis

The stack overflow is fixed -- logs confirm the identity anchor image IS being fetched and included. But the character still doesn't match. Here's why:

### Root Cause: Image Ordering + Prompt Priority

The `contentParts` array sent to the AI model currently orders images like this:

```text
1. Raw selfie reference photo(s)     <-- model treats these as primary
2. Environment images
3. Identity anchor (final look)       <-- buried as 3rd/4th image
4. Text prompt
```

Vision models give **highest weight to the first images** in the content array. The raw selfie is a casual phone photo while the identity anchor is a polished AI render. The model sees the selfie first, interprets it loosely, and generates a "new" person inspired by it -- ignoring the more accurate anchor image that appears later.

Additionally, the current approach generates the **final look first** and uses it to anchor the **default look**. This is backwards for GRWM:
- The "default/before" look should establish canonical identity (simpler outfit, closer to the selfie)
- The "final/after" look should preserve that identity while changing the styling

### Solution: Two Changes

**1. Reverse GRWM generation order (AIStudio.tsx)**

Generate the default look FIRST (it's simpler, closer to the selfie, more likely to preserve identity). Then use that result as the identity anchor for the final look.

```text
Current:  Final Look -> anchor -> Default Look (wrong direction)
Fixed:    Default Look -> anchor -> Final Look (correct direction)
```

**2. Place identity anchor FIRST in contentParts (edge function)**

When an identity anchor is provided, push it to the FRONT of the content array, before any selfie references. Add explicit prompt instructions telling the model: "The first image is the canonical identity -- match this person exactly. Subsequent reference photos provide supplementary detail."

### File Changes

| File | Change |
|------|--------|
| `src/pages/AIStudio.tsx` | Reverse GRWM flow: generate default look first, then final look with `identityAnchorUrl` pointing to the default look result |
| `supabase/functions/generate-character-preview/index.ts` | Move identity anchor to the FRONT of `contentParts` (before selfie refs); update prompt to explicitly state "first image is ground truth identity" |

### Why This Works

- The default look (casual outfit, minimal styling) is the closest representation to the raw selfie, so the AI model preserves identity most accurately
- The final look then receives BOTH the selfie references AND the already-accurate default look as anchor
- By placing the anchor image first in the content array, the model prioritizes it over the raw selfie
- The prompt reinforces this ordering with explicit instructions

