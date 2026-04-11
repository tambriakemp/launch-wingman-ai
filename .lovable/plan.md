

## Plan: Fix Category Dropdown, Rename Labels, and Fix Title Generation

### Issues Identified

1. **Category dropdown shows ALL tags from every resource type** — The `CategoryCombobox` queries all `content_vault_resources` tags without filtering by the AI Prompts subcategory. It should only show tags used by AI prompt resources.

2. **Inconsistent naming: "Tags" vs "Category"** — The bulk importer calls it "Category" but the vault filters UI calls it "Filter by Tag" and the edit dialog says "Tags". These should be unified to "Category" across the AI Prompts context.

3. **Title generation still echoes first sentence** — The `gemini-2.5-flash-lite` model is not reliably following the structured title prompt. Two fixes: (a) upgrade the model to `google/gemini-2.5-flash` for better instruction following, and (b) add explicit few-shot examples in the prompt showing input→output pairs so the model understands the expected transformation.

### Changes

**1. `src/components/admin/PromptBulkImporter.tsx` — CategoryCombobox (lines 22-36)**
- Filter the tags query to only fetch tags from resources that belong to the AI Prompts subcategory (join through `content_vault_subcategories` → `content_vault_categories` where slug = `ai-prompts`)
- Since the tags query on `content_vault_resources` can't easily join, instead query resources filtered by `resource_type IN ('image_prompt', 'video_prompt')` and extract unique tags from those

**2. `src/components/admin/PromptBulkImporter.tsx` — Label consistency**
- Line 45: Keep "Category (applied to all)" — this is correct
- Line 87: Change helper text from "Per-prompt categories from CSV" to "Per-prompt categories from CSV are preserved. This adds an additional category."
- Line 629: Change "Upload a CSV with columns for category and prompt" — already says category, good
- These are already mostly consistent; the mismatch is on the vault filters side

**3. `src/components/content-vault/VaultFilters.tsx` — Rename "Tag" to "Category" for AI Prompts**
- Line 124: Change "Filter by Tag" to "Filter by Category" when `isPromptCategory` is true
- Line 128: Change "Clear Tags" to "Clear Categories" when `isPromptCategory` is true
- The `selectedTags.length > 0 ? \`${selectedTags.length} tag(s)\`` → show "category(ies)" when AI prompts

**4. `supabase/functions/parse-prompts-bulk/index.ts` — Fix title generation (lines 122-165)**
- Upgrade model from `google/gemini-2.5-flash-lite` to `google/gemini-2.5-flash` for better instruction following
- Add 3 few-shot examples in the user message showing prompt text → expected title format
- Make the system prompt even more explicit: "Read the ENTIRE prompt. Identify: 1) WHERE is the scene set? 2) WHAT is the subject wearing? 3) What CAMERA ANGLE is described? Combine into format: 'Setting — Outfit (Angle)'"

### Technical Details

```typescript
// CategoryCombobox fix — filter to AI prompt resources only
const { data } = await supabase
  .from("content_vault_resources")
  .select("tags")
  .not("tags", "is", null)
  .in("resource_type", ["image_prompt", "video_prompt"])
  .limit(1000);

// VaultFilters — conditional label
<span>{selectedTags.length > 0 
  ? `${selectedTags.length} ${isPromptCategory ? 'category(ies)' : 'tag(s)'}` 
  : isPromptCategory ? "Filter by Category" : "Filter by Tag"}</span>

// Title generation — upgraded model + few-shot examples
model: "google/gemini-2.5-flash",
// Add examples in user content:
`Examples:
Input: "A woman standing on a sunlit rooftop terrace overlooking the city skyline, wearing a flowing red maxi dress..."
Title: "Rooftop Terrace — Red Maxi Dress (Full Body)"

Input: "Close-up portrait in a cozy coffee shop, subject wearing an oversized cream sweater..."
Title: "Coffee Shop — Cream Sweater (Close-Up)"

Now generate titles for these prompts:`
```

