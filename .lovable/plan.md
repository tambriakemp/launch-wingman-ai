

# Redesign Content Vault Main Page

## Overview

This change redesigns the Content Vault main page to match the screenshot reference, replacing the current image-based category cards with a simpler icon-based design and adding a "Popular Resources" section below the categories.

---

## Current vs New Design

| Element | Current | New |
|---------|---------|-----|
| Category Cards | Large image cards with cover images | Simple bordered cards with icon + name + "View Resources" link |
| Resource Count | Shown as "X resources" text | Replaced with "View Resources" arrow link |
| Popular Resources | Not present | New section below categories showing recent/popular resources |
| Search Bar | Not present | Not adding (per request) |
| Layout | 3-column grid | 3-column grid (maintained) |

---

## Visual Design (Based on Screenshot)

### Category Cards
```text
┌──────────────────────────────────────────┐
│  [📄 Icon]  Social Media Posts           │
│             View Resources →             │
└──────────────────────────────────────────┘
```
- Clean bordered card with subtle hover effect
- Icon with category-specific color on the left
- Category name as title
- "View Resources" link with arrow instead of count

### Popular Resources Section
```text
┌──────────────────────────────────────────────────────────────────┐
│  [📁] Popular Resources                           View all →    │
├──────────────────────────────────────────────────────────────────┤
│  [📄] Launch Announcement Template                               │
│       Social Posts                              [Canva] [⬇]     │
├──────────────────────────────────────────────────────────────────┤
│  [📄] Email Welcome Sequence                                     │
│       Ebooks                                    [PDF]   [⬇]     │
├──────────────────────────────────────────────────────────────────┤
│  [📄] Product Mockup Pack                                        │
│       Templates                                 [Canva] [⬇]     │
└──────────────────────────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/ContentVault.tsx` | Add popular resources query, add Popular Resources section, update grid layout |
| `src/components/content-vault/CategoryCard.tsx` | Complete redesign - remove image, add icon, replace count with "View Resources" link |
| `src/components/content-vault/PopularResourceItem.tsx` | **NEW** - Create component for popular resource row items |
| `src/components/content-vault/VaultHeader.tsx` | Update to show total resource count (e.g., "335+ resources available") |
| `src/components/content-vault/index.ts` | Export new PopularResourceItem component |

---

## Technical Details

### 1. CategoryCard.tsx - Complete Redesign

**Props changes:**
- Remove: `coverImageUrl`, `description`
- Add: `icon` (LucideIcon), `iconColor` (string)
- Keep: `name`, `onClick`, `showEditButton`, `onEditClick`

**New structure:**
```tsx
<Card className="border border-border hover:border-primary/30 transition-all cursor-pointer p-4">
  <div className="flex items-center gap-3 mb-2">
    <Icon className={`w-5 h-5 ${iconColor}`} />
    <span className="font-semibold text-foreground">{name}</span>
  </div>
  <div className="text-sm text-muted-foreground flex items-center gap-1">
    View Resources <ArrowRight className="w-4 h-4" />
  </div>
</Card>
```

### 2. Category Icon Mapping

Create a mapping of category slugs to icons and colors:

```typescript
const CATEGORY_ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  'social-media-posts': { icon: FileText, color: 'text-blue-500' },
  'ebooks': { icon: BookOpen, color: 'text-purple-500' },
  'planners': { icon: CalendarDays, color: 'text-green-500' },
  'email-designs': { icon: Mail, color: 'text-orange-500' },
  'photos': { icon: Image, color: 'text-emerald-500' },
  'videos': { icon: Video, color: 'text-red-500' },
  'lightroom-presets': { icon: Sliders, color: 'text-pink-500' },
  'etsy': { icon: ShoppingBag, color: 'text-amber-500' },
  'fonts': { icon: Type, color: 'text-cyan-500' },
  'business-documents': { icon: FileText, color: 'text-slate-500' },
};
```

### 3. Popular Resources Query

Add a second query to fetch recent/popular resources:

```typescript
const { data: popularResources } = useQuery({
  queryKey: ['content-vault-popular-resources'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('content_vault_resources')
      .select(`
        id,
        title,
        resource_type,
        resource_url,
        subcategory:content_vault_subcategories!inner(
          name,
          category:content_vault_categories!inner(name, slug)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) throw error;
    return data;
  },
  enabled: canAccessVault,
});
```

### 4. PopularResourceItem.tsx - New Component

Create a new component for the resource list items:

```tsx
interface PopularResourceItemProps {
  title: string;
  categoryName: string;
  resourceType: 'canva_link' | 'document' | string;
  resourceUrl: string;
  onClick: () => void;
}

export const PopularResourceItem = ({ 
  title, 
  categoryName, 
  resourceType, 
  resourceUrl,
  onClick 
}: PopularResourceItemProps) => {
  // Render row with icon, title, category, type badge, download button
};
```

### 5. VaultHeader.tsx - Update

Update to show total resource count dynamically:

```tsx
interface VaultHeaderProps {
  totalResourceCount?: number;
}

export const VaultHeader = ({ totalResourceCount }: VaultHeaderProps) => {
  return (
    <div className="flex items-start gap-4 mb-8">
      <div className="p-3 bg-amber-100/50 dark:bg-amber-900/20 rounded-xl shrink-0">
        <Package className="w-6 h-6 text-amber-600 dark:text-amber-400" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Content Vault</h1>
        <p className="text-muted-foreground">
          {totalResourceCount ? `${totalResourceCount}+ resources available` : 'Ready-to-use templates and resources'}
        </p>
      </div>
    </div>
  );
};
```

### 6. ContentVault.tsx - Layout Update

```tsx
return (
  <ProjectLayout>
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <VaultHeader totalResourceCount={totalResourceCount} />
        
        {/* Categories Grid - 3 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              name={category.name}
              icon={getCategoryIcon(category.slug).icon}
              iconColor={getCategoryIcon(category.slug).color}
              onClick={() => handleCategoryClick(category.slug)}
              showEditButton={hasAdminAccess}
              onEditClick={() => setEditingCategory(category)}
            />
          ))}
        </div>

        {/* Popular Resources Section */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-amber-500" />
              <span className="font-semibold text-foreground">Popular Resources</span>
            </div>
            <Button variant="link" onClick={() => navigate('/content-vault/all')}>
              View all →
            </Button>
          </div>
          <div className="divide-y divide-border">
            {popularResources?.map((resource) => (
              <PopularResourceItem key={resource.id} ... />
            ))}
          </div>
        </Card>
      </div>
    </div>
  </ProjectLayout>
);
```

---

## Summary

1. **Simplify CategoryCard** - Remove images, add icons with category-specific colors, replace count with "View Resources" link
2. **Create PopularResourceItem** - New component for resource list rows in the Popular Resources section
3. **Add Popular Resources section** - Fetch recent resources and display below categories
4. **Update VaultHeader** - Show dynamic total resource count
5. **No search bar** - As requested, search functionality is not included

