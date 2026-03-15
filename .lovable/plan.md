

## Font Bulk Importer for Content Vault

### Overview
Build an admin component that lets you upload ZIP files containing font files (.ttf, .otf, .woff, .woff2), automatically extracts them, uploads each font to storage, generates a preview image showing what the font looks like, and creates entries in the `content_vault_resources` table under the Fonts category.

### Existing Infrastructure
- **Font subcategories** already exist: Serif, Sans Serif, Script, Display, Font Pairings
- **Storage bucket**: `content-media` (public) — will store font files and preview images
- **AI image generation**: Available via Lovable AI gateway (gemini flash image model) — but not needed here since we can render font previews on a canvas element client-side
- **Pattern to follow**: Similar to `BulkPhotoUploadCard.tsx` — drag-drop files, process in batches, upload to storage, insert DB records

### Implementation Plan

**1. New component: `src/components/admin/FontBulkUploader.tsx`**
- Card UI with drag-and-drop zone for ZIP files
- Subcategory selector (Serif, Sans Serif, Script, Display, Font Pairings)
- On ZIP upload:
  - Use JSZip (need to add dependency) to extract font files (.ttf, .otf, .woff, .woff2) from the ZIP
  - For each font file:
    - Load the font temporarily using `FontFace` API
    - Render a preview image on an off-screen `<canvas>` showing sample text (e.g., "AaBbCc 123 — The quick brown fox") in the font
    - Export canvas as PNG blob
    - Upload font file to `content-media/fonts/{timestamp}-{filename}`
    - Upload preview PNG to `content-media/font-previews/{timestamp}-{fontname}.png`
    - Insert into `content_vault_resources` with:
      - `title`: font name (derived from filename)
      - `resource_url`: public URL of the font file (download link)
      - `cover_image_url`: public URL of the generated preview image
      - `resource_type`: `"download"`
      - `subcategory_id`: selected subcategory
- Progress bar showing upload status
- Results summary (added/skipped/failed)

**2. Add to admin page: `src/pages/AdminContentVault.tsx`**
- Import and render `FontBulkUploader` in the content vault management page

**3. Add dependency: `jszip`**
- For client-side ZIP extraction

### Font Preview Generation (Client-Side Canvas)
```text
┌──────────────────────────────────┐
│  Montserrat Bold                 │  ← font name
│                                  │
│  AaBbCcDdEeFf                    │  ← sample chars
│  The quick brown fox jumps       │  ← pangram
│  over the lazy dog               │
│  1234567890 !@#$%                │  ← numbers/symbols
└──────────────────────────────────┘
```
- Canvas size: 800×400px with subtle gradient background
- Renders 3 lines of sample text at different sizes
- Exported as PNG and uploaded as the cover image

### Scope
- 1 new component file
- 1 new dependency (jszip)
- 1 minor edit to AdminContentVault.tsx
- No database changes needed — uses existing tables and buckets

