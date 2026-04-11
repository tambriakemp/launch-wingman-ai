

## Plan: Fix Title Generation & Improve Duplicate Detection

### Problem 1: Titles defaulting to "Prompt 1", "Prompt 2"
The edge function `parse-prompts-bulk` generates titles via AI, but falls back to `Prompt ${i+1}` when the AI response doesn't match the expected count (line 176: `parsed.titles.length === promptTexts.length`). This strict equality check fails if the AI returns fewer/more titles than prompts. The fix: relax the check and map available titles, falling back only for missing ones.

### Problem 2: Duplicate detection not catching same-text prompts
The current dedup logic (line 292-295) uses `&&` — it only skips a prompt if BOTH the description AND the title match. Since auto-generated titles are often generic ("Prompt 1"), near-identical prompts with different titles slip through. Additionally, there's no within-batch deduplication (if the CSV itself has duplicates).

### Changes

**1. `supabase/functions/parse-prompts-bulk/index.ts`**
- Remove the strict length equality check on line 176 — use as many titles as the AI returns, fall back for the rest
- Use a slightly better prompt to encourage unique, descriptive titles

**2. `src/components/admin/PromptBulkImporter.tsx`**
- Change dedup filter from `&&` to `||` — skip if description OR title matches existing
- Add within-batch dedup: track seen descriptions in a Set during the filter loop so duplicate prompts within the same import are also caught
- Normalize whitespace in description comparison (collapse multiple spaces/newlines) for near-identical matching

### Technical Details
```typescript
// Dedup fix — PromptBulkImporter.tsx line 292-296
const seenDescs = new Set<string>();
const unique = parsedPrompts.filter((p) => {
  const descKey = p.text.trim().toLowerCase().replace(/\s+/g, ' ');
  const titleKey = p.title.trim().toLowerCase();
  if (existingDescs.has(descKey) || existingTitles.has(titleKey) || seenDescs.has(descKey)) {
    return false;
  }
  seenDescs.add(descKey);
  return true;
});
```

```typescript
// Title fallback fix — edge function line 176
if (parsed.titles && parsed.titles.length > 0) {
  titles = promptTexts.map((_, i) => parsed.titles[i] || `Prompt ${i + 1}`);
}
```

