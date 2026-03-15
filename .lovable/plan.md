

## Fix Swapped Canva URLs in Existing Resources

### Problem
9 resources have `mode=preview` (preview/watch links) stored in `resource_url` instead of the template/design link. This causes card clicks to open the preview instead of the Canva editor.

### Affected Resources

**Swapped (template link is in preview_url, preview link is in resource_url):**
- "Everyday Happiness" — swap resource_url and preview_url
- "Limiting Beliefs" — swap resource_url and preview_url

**Only preview link exists (preview_url is null):**
- "40 Etsy Mockup Templates for Digital Products"
- "Melanin Tips and Tricks"
- "Millie - Bold and Luxury"
- "Modern & Ambitious Entrepreneur"
- "Motivating"
- "Paris"

For these 6, move current resource_url → preview_url, then derive a template URL by stripping `&mode=preview` from the URL.

**Both fields have same preview link:**
- "Social Media Coach II" — derive template URL by stripping `&mode=preview`, keep original as preview_url.

### Implementation
Run 9 UPDATE statements against the database using the data insert tool. No code changes needed — the edge function fix from the previous update will prevent this from happening on future imports.

### Result
- Card click → opens Canva design/template (correct)
- Eye icon → opens preview (correct)

