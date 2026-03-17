

## Add External Assets Uploader to Admin Assets Tab

**Goal**: Allow admins to upload documents/files and get shareable public URLs that don't require authentication.

### Approach

Add a new "External Assets" card to the existing `MarketingAssetsTab` component (the Assets tab in `/admin`). This will use the existing `brand-assets` public storage bucket with a new `external/` folder prefix.

### Database

- **New table `external_assets`**: Tracks uploaded files with metadata (name, file path, public URL, file size, mime type, uploaded_by). RLS: admin-only write, public read.

### Storage

- Use existing **`brand-assets`** bucket (already public) with an `external/` folder prefix.
- Add RLS policy for admin uploads if not already covered.

### UI Changes (`MarketingAssetsTab.tsx`)

Add a new card section above or below the mockups grid:

1. **Upload area** -- drag-and-drop or click to upload any file type (PDF, images, docs, etc.)
2. **Uploaded files list** -- table/grid showing:
   - File name
   - File type badge
   - File size
   - Upload date
   - **Copy Link** button (copies public URL to clipboard)
   - **Open** button (opens in new tab)
   - **Delete** button
3. Files are uploaded to `brand-assets/external/{timestamp}-{filename}`
4. Public URL is stored in `external_assets` table for easy retrieval

### Steps

1. Create `external_assets` table with RLS policies (admin write, public read)
2. Add storage RLS policies for `brand-assets` bucket `external/` path if needed
3. Build the upload + file list UI section within the Assets tab

