

## Plan: Rich Description Formatting + AI Cover Image Generation

### 1. Rich Description Display in PromptModal

The description already preserves `whitespace-pre-wrap`, so line breaks work. To support richer formatting (bullets, paragraphs, bold), we'll render the description as simple Markdown-like formatting:

**In `PromptModal.tsx`:**
- Parse `description` to convert basic patterns: `- ` or `• ` lines into bullet lists, double newlines into paragraph breaks, `**text**` into bold
- Use a small render function (no external library needed) that splits by paragraphs and renders `<ul>` for bullet sections and `<p>` for paragraph text
- The "Copy Prompt" button continues to copy the raw text (no HTML)

**In `ResourceEditDialog.tsx`:**
- Change description `<Textarea>` rows from 2 to 6 for ai_prompt types so longer formatted prompts are easier to edit

### 2. AI Cover Image Generation (ai_prompt resources only)

**In `ResourceEditDialog.tsx`:**
- Add a new "Generate Cover with AI" button that only appears when `resource_type === 'ai_prompt'`
- Add a reference image upload area (small, separate from the main cover image area) — the admin uploads a reference photo
- Store reference image in state (as base64 or uploaded URL)
- On click "Generate Cover", call a new edge function

**New edge function: `supabase/functions/generate-prompt-cover/index.ts`**
- Accepts `{ prompt: string, referenceImageUrl?: string }` 
- Uses `google/gemini-3-pro-image-preview` (best for image generation)
- Sends the prompt text as the generation instruction, with the reference image if provided
- Returns the generated image as base64
- The frontend uploads the result to the `content-media` bucket and sets it as the cover image

### Flow
1. Admin opens Edit Resource for an ai_prompt resource
2. Optionally uploads/pastes a reference photo into the reference image area
3. Clicks "Generate Cover with AI"
4. Edge function sends the description (prompt text) + reference image to Gemini image model
5. Generated image is returned, uploaded to storage, and set as cover_image_url

### Files to create/modify
- **Modify**: `src/components/content-vault/PromptModal.tsx` — rich text rendering for description
- **Modify**: `src/components/content-vault/ResourceEditDialog.tsx` — add reference image + generate cover button for ai_prompt type, increase textarea rows
- **New**: `supabase/functions/generate-prompt-cover/index.ts` — AI image generation edge function

