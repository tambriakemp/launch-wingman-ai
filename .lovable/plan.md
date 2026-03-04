

## Plan: Cover Image Fit/Position Control

### Problem
AI-generated cover images get cropped with `object-cover` + center positioning, cutting off important parts of the image.

### Solution
Add a `cover_image_fit` column to `content_vault_resources` that stores the CSS object-fit value (`cover` or `contain`). Default to `cover` for backward compatibility. In the Edit Resource dialog, add a simple toggle so admins can switch between "Fill" (cover) and "Fit" (contain) modes.

### Database Migration
```sql
ALTER TABLE content_vault_resources 
ADD COLUMN cover_image_fit text NOT NULL DEFAULT 'cover';
```

### Changes

**1. `src/components/content-vault/ResourceEditDialog.tsx`**
- Add `cover_image_fit` to form state (default `'cover'`)
- Below the cover image preview, add a small toggle group: **Fill** | **Fit**
- Fill = `object-cover`, Fit = `object-contain` (with a subtle background color behind contain)
- Save the value to the database on submit
- Apply the selected fit to the preview image in the dialog

**2. `src/components/content-vault/ResourceCard.tsx`**
- Read `cover_image_fit` from the resource data
- Apply `object-cover` or `object-contain` accordingly on the card image
- When `contain`, add a background color so it doesn't look empty

**3. `src/components/content-vault/PromptModal.tsx`**
- Same: read `cover_image_fit` and apply to the modal image

### Files
- **Migration**: Add `cover_image_fit` column
- **Modify**: `ResourceEditDialog.tsx` — toggle + form state
- **Modify**: `ResourceCard.tsx` — dynamic object-fit class
- **Modify**: `PromptModal.tsx` — dynamic object-fit class

