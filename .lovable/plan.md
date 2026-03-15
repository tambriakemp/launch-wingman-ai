

## Fix: Upload ZIP as the downloadable resource, not extracted files

### Problem
Currently the importer extracts every individual font file from each ZIP and creates a separate resource per file. The user wants each ZIP to remain as a single downloadable resource — the ZIP itself is what end users download.

### Change

**File: `src/components/admin/FontBulkUploader.tsx`**

Restructure the data model from per-font-file to per-ZIP-file:

1. **Change `FontEntry` to `ZipFontEntry`** — each entry represents one ZIP file, storing the original ZIP `File` object (not extracted font data). Also store a preview generated from the first font found inside the ZIP.

2. **Update `handleZipFiles`** — for each ZIP:
   - Extract fonts temporarily (in memory only) to find the first valid font file
   - Generate a canvas preview from that first font (same preview logic as now)
   - Create one entry per ZIP with: `zipFile: File`, `fontName` derived from the ZIP filename, `previewDataUrl` from the first font

3. **Update `startUpload`** — for each ZIP entry:
   - Upload the original ZIP file (not extracted fonts) to `content-media/fonts/{ts}-{name}.zip`
   - Upload the generated preview PNG to `content-media/font-previews/`
   - Insert one `content_vault_resources` record per ZIP with `resource_url` pointing to the ZIP file

### Result
- 2 ZIP files → 2 resources in the Content Vault (not 7)
- Users download the full ZIP
- Preview image still shows what the font looks like (generated from the first font in the ZIP)

