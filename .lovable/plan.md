

## Add Carousel Usage Tracking to Admin Heatmap

### Problem
The Carousel Builder generates content on-the-fly without persisting anything to the database, so there's nothing to count.

### Approach
1. **Create a `carousel_generations` tracking table** via migration — simple table with `id`, `user_id`, `created_at`, `slide_count`
2. **Insert a row in CarouselBuilder.tsx** when a carousel is successfully generated (after the `generate-carousel` edge function returns)
3. **Add the count query** to the edge function, type, and heatmap config

### Changes

#### Migration — new `carousel_generations` table
```sql
CREATE TABLE public.carousel_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  slide_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.carousel_generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own" ON public.carousel_generations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own" ON public.carousel_generations FOR SELECT TO authenticated USING (auth.uid() = user_id);
```

#### `src/pages/CarouselBuilder.tsx`
After successful carousel generation (where `setSlides(data.slides)` is called), insert a tracking row:
```ts
await supabase.from("carousel_generations").insert({ user_id: user.id, slide_count: data.slides.length });
```

#### `supabase/functions/admin-platform-stats/index.ts`
Add to Promise.all:
```ts
supabaseClient.from('carousel_generations').select('*', { count: 'exact', head: true }),
```
Add to featureUsage: `carousels: carouselResult.count || 0`

#### `src/hooks/useAdminPlatformStats.ts`
Add `carousels: number` to FeatureUsage interface.

#### `src/components/admin/FeatureUsageHeatmap.tsx`
Add to featureConfig in the Tools category:
```ts
{ key: 'carousels', label: 'Carousels', category: 'Tools' },
```

