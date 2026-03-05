

## Plan: Bulk Cover Photo Generation for AI Prompts

### Overview
Add a "Generate Covers" bulk action to the existing selection mode on the AI Prompts category page. When admin selects prompts and clicks "Generate Covers", a dialog appears where they can optionally upload a reference photo, then batch-generate cover images for all selected prompts sequentially.

### Changes

**1. `src/pages/ContentVaultCategory.tsx`**
- Add a new "Generate Covers" button in the selection mode toolbar (next to "Delete")
- Only show this button when on the `ai-prompts` category
- Add state for a `BulkCoverGeneratorDialog` (open/close, selected resource list)
- Pass the selected resources (filtered to those without cover images, or all selected) to the dialog

**2. New: `src/components/content-vault/BulkCoverGeneratorDialog.tsx`**
- Dialog with:
  - Optional reference image upload (drag-drop or file picker) with preview
  - List of selected prompts showing title + status (pending/generating/done/error)
  - "Generate All" button to start sequential processing
  - Progress indicator (e.g., "3 of 12 complete")
- Processing logic:
  - For each selected prompt, call `supabase.functions.invoke('generate-prompt-cover', { body: { prompt: resource.description, referenceImageUrl } })`
  - On success, upload the returned base64 image to `content-media` storage bucket
  - Update the resource's `cover_image_url` in the database
  - Show per-item status (spinner → checkmark → error icon)
  - Add a small delay between requests to avoid rate limiting (e.g., 2 seconds)
- Handle 429/402 errors gracefully — pause and show message
- On completion, invalidate queries to refresh the grid

**3. Edge function `generate-prompt-cover/index.ts`** — No changes needed. It already accepts `prompt` + optional `referenceImageUrl` and returns the generated image.

### Flow
1. Admin enters selection mode → selects prompts needing covers
2. Clicks "Generate Covers" → dialog opens
3. Optionally uploads a reference photo
4. Clicks "Generate All" → each prompt is processed sequentially
5. Cover images are saved to storage and linked to resources automatically

