

# Implement Download Tracking for Popular Resources

## Overview

This change adds a download tracking system to make the "Popular Resources" section data-driven, showing resources based on actual user engagement. It also includes a fallback mechanism to display the first resource from each of the first 5 categories when there's insufficient download data.

---

## Approach

There are two options for tracking downloads:

| Approach | Pros | Cons |
|----------|------|------|
| **A: Add download_count column to resources** | Simple queries, fast lookups, no join needed | Requires increment on every download, less granular data |
| **B: Create separate tracking table** | Detailed analytics (who, when, which resource), can track trends over time | Requires joins, more storage, slightly more complex queries |

**Recommendation**: Option A (download_count column) is sufficient for the popularity feature while keeping things simple. If you need detailed analytics later, we can add Option B.

---

## Implementation Plan

### 1. Database Changes

Add a `download_count` column to the `content_vault_resources` table:

```sql
ALTER TABLE content_vault_resources 
ADD COLUMN download_count INTEGER NOT NULL DEFAULT 0;
```

### 2. Update Download Tracking

Modify the `vault-download` edge function to increment the download count when a resource is downloaded.

**File: `supabase/functions/vault-download/index.ts`**

After validating the resource exists (around line 53), add:

```typescript
// Increment download count
await supabase
  .from('content_vault_resources')
  .update({ download_count: (resource.download_count || 0) + 1 })
  .eq('id', resource.id);
```

Note: The query will need to select `id, download_count` instead of just `id`.

### 3. Track Canva Link Opens

Since Canva links open directly in a new tab without going through the edge function, we need to track those clicks in the frontend.

**Files to update:**
- `src/components/content-vault/ResourceCard.tsx` - Track when Canva cards are clicked
- `src/components/content-vault/PopularResourceItem.tsx` - Track when items are clicked
- `src/components/content-vault/ResourceLightbox.tsx` - Track external link clicks

**Add a shared tracking function:**

```typescript
// Helper to track resource access
const trackResourceAccess = async (resourceId: string) => {
  try {
    await supabase.rpc('increment_resource_download', { resource_id: resourceId });
  } catch (error) {
    console.error('Failed to track resource access:', error);
  }
};
```

**Create a database function for atomic increment:**

```sql
CREATE OR REPLACE FUNCTION increment_resource_download(resource_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE content_vault_resources 
  SET download_count = download_count + 1 
  WHERE id = resource_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4. Update Popular Resources Query

**File: `src/pages/ContentVault.tsx`**

Update the query to:
1. First try to get resources with the highest download counts
2. If no resources have downloads, fall back to first resource from each of the first 5 categories

```typescript
// Fetch popular/recent resources
const { data: popularResources, isLoading: popularLoading } = useQuery({
  queryKey: ['content-vault-popular-resources', categories],
  queryFn: async () => {
    // First, try to get resources sorted by download count
    const { data: topDownloaded, error: topError } = await supabase
      .from('content_vault_resources')
      .select(`
        id,
        title,
        resource_type,
        resource_url,
        download_count,
        subcategory:content_vault_subcategories!inner(
          name,
          category:content_vault_categories!inner(name, slug)
        )
      `)
      .gt('download_count', 0)
      .order('download_count', { ascending: false })
      .limit(5);
    
    if (topError) throw topError;
    
    // If we have popular resources with downloads, use them
    if (topDownloaded && topDownloaded.length >= 5) {
      return topDownloaded;
    }
    
    // Fallback: Get first resource from each of the first 5 categories
    if (!categories || categories.length === 0) {
      return topDownloaded || [];
    }
    
    const first5Categories = categories.slice(0, 5);
    const fallbackResources = [];
    
    for (const category of first5Categories) {
      const { data: firstResource } = await supabase
        .from('content_vault_resources')
        .select(`
          id,
          title,
          resource_type,
          resource_url,
          download_count,
          subcategory:content_vault_subcategories!inner(
            name,
            category:content_vault_categories!inner(name, slug)
          )
        `)
        .eq('subcategory.category.id', category.id)
        .order('position', { ascending: true })
        .limit(1)
        .maybeSingle();
      
      if (firstResource) {
        fallbackResources.push(firstResource);
      }
    }
    
    // Combine any downloaded resources with fallback to reach 5
    const combined = [...(topDownloaded || [])];
    const existingIds = new Set(combined.map(r => r.id));
    
    for (const resource of fallbackResources) {
      if (!existingIds.has(resource.id) && combined.length < 5) {
        combined.push(resource);
        existingIds.add(resource.id);
      }
    }
    
    return combined;
  },
  enabled: canAccessVault && !!categories,
});
```

---

## Files to Modify

| File | Changes |
|------|---------|
| Database Migration | Add `download_count` column and `increment_resource_download` function |
| `supabase/functions/vault-download/index.ts` | Increment download count after successful download |
| `src/pages/ContentVault.tsx` | Update popular resources query with fallback logic |
| `src/components/content-vault/ResourceCard.tsx` | Add tracking for Canva link clicks |
| `src/components/content-vault/PopularResourceItem.tsx` | Add tracking for item clicks |
| `src/components/content-vault/ResourceLightbox.tsx` | Add tracking for external link clicks |

---

## Tracking Points Summary

| Action | Where Tracked |
|--------|---------------|
| Download via vault-download function | Edge function (increments on successful download) |
| Canva link click from ResourceCard | Frontend before opening link |
| Resource click from PopularResourceItem | Frontend before opening link |
| External link click from Lightbox | Frontend before opening link |

---

## Visual Behavior

| Scenario | Popular Resources Shows |
|----------|------------------------|
| Resources have download data | Top 5 by download_count |
| Some resources have downloads | Downloaded resources + fallback from categories |
| No download data yet | First resource from each of first 5 categories |

---

## Future Considerations

Once download tracking is in place, you could:
- Show download counts on admin view
- Add "trending" badges for resources with recent high activity
- Create admin reports on most popular content
- Track downloads by time period (weekly/monthly trending)

