

## Update ZIP Download Naming Convention

### Problem
The downloaded ZIP is named `carousel-slides.zip` — a generic name unrelated to the content.

### Solution
Use the `offer` state value (the offer/product description entered in the brief) to generate a slug for the ZIP filename. If `offer` is empty, fall back to `"carousel-slides"`.

### Change

**`src/pages/CarouselBuilder.tsx`** (line 567)

Replace the hardcoded filename:
```ts
a.download = "carousel-slides.zip";
```

With a slugified version of the `offer` value:
```ts
const slug = offer
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "")
  .slice(0, 50) || "carousel-slides";
a.download = `${slug}-carousel.zip`;
```

This takes the first ~50 characters of the offer description, converts to a URL-safe slug, and appends `-carousel.zip`. Individual slide filenames inside the ZIP remain `slide-01.png`, `slide-02.png`, etc.

