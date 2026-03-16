

## Fix: Hero image flash on Link in Bio page

**Problem**: The hero image initially renders with the fallback picsum URL, then switches to the real branding URL after the database fetch completes — causing a visible flash of the wrong image.

**Solution**: Don't render the hero image at all until branding data has loaded. Since we already have an `isLoaded` flag and the page fades in with `opacity: 0 → 1`, we just need to defer the image `src` until branding is available.

**Changes** (`src/pages/LinkInBio.tsx`):
- Change the hero `<img>` src from `branding.hero_image_url || "https://picsum.photos/..."` to only set the src when `isLoaded` is true
- Before data loads, render no `src` (or skip the img entirely), so there's no stale image flash
- The simplest fix: use `isLoaded ? (branding.hero_image_url || fallbackUrl) : undefined` for the `src` attribute, so the image only starts loading after we know the real URL

