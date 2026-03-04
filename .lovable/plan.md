

## Plan: Bulk AI Prompt Importer (Copy-Paste + PDF Parser)

### Overview
Add a new admin card on the Content Vault management page specifically for bulk-adding AI prompts. It supports two input methods:
1. **Copy-paste** — paste multiple prompts separated by a delimiter (blank line, `---`, or numbered headings)
2. **PDF upload** — upload a PDF, parse it server-side using AI to extract individual prompts separated by headings/images

Each extracted prompt gets an auto-generated short title (via AI) and can have tags and a cover image assigned before importing.

### Components

**1. New admin component: `src/components/admin/PromptBulkImporter.tsx`**
- Card with two tabs: "Paste Prompts" and "Upload PDF"
- **Paste tab**: Large textarea. User pastes multiple prompts. A "Parse" button splits by blank lines or `---` separators. Shows parsed prompts in an editable list.
- **PDF tab**: File upload for PDF. Sends to a new edge function that extracts text and splits into individual prompts.
- **Shared UI after parsing**:
  - List of parsed prompts, each showing a preview of the text and an editable auto-generated title
  - Tag input (shared across all or per-prompt)
  - Optional cover image URL field per prompt (or bulk)
  - Subcategory selector (pre-set to the AI Prompts "General" subcategory)
  - "Generate Titles" button that calls AI to create short titles from each prompt
  - "Import All" button that inserts into `content_vault_resources` with `resource_type = 'ai_prompt'`

**2. New edge function: `supabase/functions/parse-prompts-bulk/index.ts`**
- Accepts either `{ prompts: string[] }` (pre-split from paste) or `{ pdfBase64: string }` (PDF file)
- For paste: just returns the prompts as-is
- For PDF: uses AI (Gemini) to extract and split individual prompts from the PDF text
- For all prompts: calls AI to generate a short title (3-6 words) for each prompt
- Returns `{ prompts: { title: string, text: string }[] }`

**3. Update `AdminContentVault.tsx`**
- Add the new `PromptBulkImporter` card to the page

### Import flow
1. Admin pastes prompts or uploads PDF
2. System parses/splits into individual prompts
3. AI generates short titles for each
4. Admin reviews, edits titles/tags, optionally adds cover images
5. Admin clicks "Import" — inserts all as `content_vault_resources` with `resource_type = 'ai_prompt'`, `description = prompt text`, `resource_url = '#'` (placeholder since prompts don't have URLs)

### Files to create/modify
- **New**: `src/components/admin/PromptBulkImporter.tsx`
- **New**: `supabase/functions/parse-prompts-bulk/index.ts`
- **Modify**: `src/pages/AdminContentVault.tsx` — add the new card

