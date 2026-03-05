

## Plan: Improve PDF Parsing for Column Layouts

### Problem
The current system prompt for PDF extraction is too generic. It says prompts are "separated by headings, images, or page breaks" — but the screenshot shows a **multi-column grid layout** where each prompt sits below a corresponding image, arranged in 2-3 columns across the page. The AI model needs explicit instructions to handle this visual layout.

Additionally, the current `WORKER_LIMIT` error suggests the base64 conversion of larger PDFs is still hitting memory limits. We should switch to `google/gemini-2.5-pro` for better document understanding of complex layouts.

### Solution
Update the system and user prompts in the edge function (lines 48-49, 57-58) to explicitly describe the column-based layout pattern:

1. **Better system prompt** — Describe the expected layout: prompts arranged in a grid/column format, each paired with an image above or beside it. Instruct the model to read across columns and extract the full text block associated with each image.

2. **Upgrade model** — Use `google/gemini-2.5-pro` instead of `google/gemini-2.5-flash` for the extraction step, as Pro handles complex visual document layouts significantly better.

3. **Better user prompt** — Tell the model the PDF uses a magazine-style multi-column layout where each prompt is a text block near/below a photo, and to extract each one as a complete standalone prompt.

### File to modify
- `supabase/functions/parse-prompts-bulk/index.ts` — lines 44, 48-49, 57-58

### Changes
- Line 44: Change model from `google/gemini-2.5-flash` to `google/gemini-2.5-pro`
- Lines 48-49: Update system prompt to describe column/grid layouts with image-text pairs
- Lines 57-58: Update user prompt to specify reading across columns and extracting each text block as a separate prompt

