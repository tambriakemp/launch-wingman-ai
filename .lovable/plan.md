

## Fix: Canva URL swap bug in bulk import

### Problem

When importing via the "Canva Bulk Import" paste box, `resource_url` and `preview_url` sometimes get swapped in the database. This causes:
- **Card click** (should open design in Canva) → opens the preview instead
- **Eye icon** (should show preview) → opens the design editor instead

### Root Cause

In `supabase/functions/bulk-import-canva/index.ts`, two issues combine:

1. **Fallback logic (line 364)**: When no `templateUrl` is identified, the code falls through to use `previewUrl` as the `resource_url`:
   ```ts
   const resourceUrl = design.templateUrl || design.previewUrl || design.editUrl;
   ```
   Then on line 411, `preview_url` is also set to `design.previewUrl` — so both fields get the same preview URL, or worse, the preview URL lands in `resource_url`.

2. **URL classification ambiguity (line 53-58)**: A Canva `/view` link with `mode=preview` query param is classified as `preview`, but the `/view` path segment could also serve as a usable template link. When users paste a single `/view?mode=preview` link, there's no `templateUrl`, so the preview URL incorrectly becomes the `resource_url`.

### Fix

**File: `supabase/functions/bulk-import-canva/index.ts`**

1. **When only a preview URL exists, derive a template URL from it**: If a `/watch` or `/view?mode=preview` URL is the only link, construct the template URL by converting `/watch` to `/view` or stripping `mode=preview`. Store the original as `preview_url` and the derived version as `resource_url`.

2. **When only a template URL exists, derive a preview URL**: Convert `/view` to `/watch` format for the preview link, so both fields are populated correctly.

3. **Update the import block** (lines 361-415) to use this derivation logic before inserting, ensuring `resource_url` always points to the template/design link and `preview_url` always points to the watch/preview link.

### Specific Changes

Add a helper function:
```ts
function deriveUrls(design: ParsedDesign): { resourceUrl: string; previewUrl: string | null } {
  // Prefer template URL for resource_url
  if (design.templateUrl) {
    // Derive preview from template if missing
    const preview = design.previewUrl || design.templateUrl.replace(/\/view(\?|$)/, '/watch$1');
    return { resourceUrl: design.templateUrl, previewUrl: preview !== design.templateUrl ? preview : null };
  }
  
  // Only preview URL available — derive template from it
  if (design.previewUrl) {
    const templateUrl = design.previewUrl
      .replace(/\/watch(\?|$)/, '/view$1')
      .replace(/([?&])mode=preview(&|$)/, '$1')
      .replace(/[?&]$/, '');
    return { resourceUrl: templateUrl, previewUrl: design.previewUrl };
  }
  
  // Only edit URL
  return { resourceUrl: design.editUrl!, previewUrl: null };
}
```

Update the insert block (~line 405-415) to use `deriveUrls(design)` instead of raw template/preview fields.

**Redeploy** the `bulk-import-canva` edge function after changes.

### Scope
- One edge function file modified and redeployed
- No frontend changes needed — `ResourceCard` click logic is already correct when URLs are stored in the right fields

