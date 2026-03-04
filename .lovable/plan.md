

## Plan: Improve Reference Image Prompt for Identity Preservation

### Problem
The current prompt tells the AI to use the reference image as "style/composition guidance," which means it treats it as a mood board rather than preserving the actual person/subject in the photo. The AI needs explicit instructions to keep the person's identity, features, and appearance from the reference image.

### Solution
Update the prompt in `supabase/functions/generate-prompt-cover/index.ts` (line 44-47) to explicitly instruct the model to preserve the person's identity, facial features, and appearance from the reference image — not just use it for style guidance.

**Change the reference image prompt from:**
> "using the provided reference image as style/composition guidance"

**To something like:**
> "The reference image shows the person/subject that MUST appear in the generated image. Preserve their exact facial features, hair, skin tone, and overall appearance. Generate the scene described in the prompt but featuring this exact person."

### File to modify
- `supabase/functions/generate-prompt-cover/index.ts` — update the text prompt on lines 44-47

**Note:** Gemini's image generation model has inherent limitations with facial identity preservation compared to specialized models like InstantID. The improved prompt will yield better results but may not achieve perfect likeness in all cases.

