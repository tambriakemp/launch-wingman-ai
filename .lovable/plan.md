

## Fix Character Identity Consistency for GRWM First Look

### Problem

When generating "Get Ready With Me" previews, the default look (first look) doesn't match the uploaded character reference, while the final look does. Both calls currently run in parallel with identical reference images, but the first look has weaker constraints and the model drifts from the subject's appearance.

### Solution

Make the GRWM preview generation **sequential instead of parallel**: generate the final look first (since it produces a more accurate result), then pass its output as an **additional identity anchor** to the default look generation.

### Changes

**`src/pages/AIStudio.tsx` -- `handleGeneratePreview`**

Current flow:
```
Promise.all([defaultLook, finalLook])  // parallel, no cross-reference
```

New flow:
```
1. Generate final look first
2. Pass final look result URL as extra reference to default look
3. Generate default look with strengthened identity anchor
```

**`supabase/functions/generate-character-preview/index.ts`**

- Accept a new optional field `identityAnchorUrl` in the request body
- When present, fetch that image and include it as an additional reference image in the content parts with a prompt note: "This is an already-generated canonical identity of the same person. The default look MUST depict the exact same individual."
- Strengthen the non-final-look identity prompt to emphasize facial feature matching

### File Changes

| File | Change |
|------|--------|
| `src/pages/AIStudio.tsx` | Make GRWM generation sequential: final look first, then default look with `identityAnchorUrl` |
| `supabase/functions/generate-character-preview/index.ts` | Accept `identityAnchorUrl`, fetch and include as extra reference; strengthen identity prompt for non-final looks |

### How It Works After the Fix

1. User clicks "Generate Preview" for a GRWM project
2. Final look generates first (already produces accurate identity)
3. The final look image URL is passed to the default look generation as `identityAnchorUrl`
4. Default look generation receives the original selfie references PLUS the accurate final look as a strong identity anchor
5. Both previews now depict the same person consistently
