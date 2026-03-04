

## Plan: Add "AI Prompts" Category to Content Vault

### Overview
Add a new "AI Prompts" category to the Content Vault. Unlike other categories that use downloads/lightbox, AI Prompts entries show a modal with the cover image, prompt text, and a copy button. Prompts are stored as a new `resource_type` ("ai_prompt") in the existing `content_vault_resources` table, using `description` for the prompt text.

### Database Changes

**1. Migration: Add "AI Prompts" category + subcategory**
- Insert a new row into `content_vault_categories` with name "AI Prompts", slug "ai-prompts"
- Insert a default subcategory (e.g., "General") under it
- Seed the example prompt from the screenshot as the first resource with `resource_type = 'ai_prompt'`, the prompt text in `description`, a generated short title, the uploaded image as `cover_image_url`, and a tag like "Lifestyle"

### Frontend Changes

**2. New Component: `PromptModal.tsx`** (`src/components/content-vault/PromptModal.tsx`)
- Dialog with the cover image displayed prominently at top
- Prompt text below in a readable format
- "Copy Prompt" button that copies `description` to clipboard with toast feedback
- Tags displayed as badges
- Title at the top

**3. Modify `ContentVaultCategory.tsx`**
- Detect when the current category slug is `"ai-prompts"`
- Instead of opening the lightbox on resource click, open the new `PromptModal`
- Hide the download button on `ResourceCard` for `ai_prompt` type resources (they don't need downloading)

**4. Seed the example resource**
- Title: "Luxury Street Style Portrait" (auto-generated from the prompt)
- Tag: "Lifestyle"
- Cover image: the uploaded screenshot image, stored in content vault storage
- Prompt: the full text from the uploaded image

### Files to Create/Modify
- **New**: `src/components/content-vault/PromptModal.tsx`
- **Modify**: `src/pages/ContentVaultCategory.tsx` — add prompt modal logic for ai_prompt resources
- **Modify**: `src/components/content-vault/ResourceCard.tsx` — hide download for ai_prompt type
- **Migration**: Insert category, subcategory, and seed resource

