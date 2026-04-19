

## Answers to your questions

### 1. Does R2 upload check for duplicates? **No.**

Every upload path (`upload-photo-to-r2`, `upload-document-to-r2`, `upload-preset-to-r2`, `process-photo-batch`) prepends `Date.now()` to the filename, so the R2 key is always unique. `sync-r2-vault` only dedupes by exact `resource_url` already in the DB — but since uploads always produce a new URL, re-uploading the same photo silently creates duplicates in both R2 and the vault.

### 2. Can it extract zip files? **No.**

`.zip` is only accepted in the **Lightroom Presets** uploader, and the entire archive is stored as one downloadable file. Photos / videos / documents uploaders reject `.zip`, and nothing inside any zip is ever unpacked.

---

## Plan

### Part A — Add duplicate detection to all R2 uploads

1. **Schema**: add `content_hash` (text, indexed) to `content_vault_resources`.
2. **In each upload edge function**, before signing the PUT to R2:
   - Compute SHA-256 of the file bytes.
   - Query `content_vault_resources` for an existing row with that hash.
   - If found → skip R2 upload, return existing URL, mark as duplicate in response.
   - If not → upload to R2 and store the hash on the new row.
3. **UI**: `R2ManagementCard` shows `uploaded: N • skipped (duplicate): M` in the toast/progress.
4. **Backfill**: optional follow-up — `sync-r2-vault` HEADs existing R2 keys to populate `content_hash` for legacy rows.

Files: migration + `upload-photo-to-r2`, `upload-document-to-r2`, `upload-preset-to-r2`, `process-photo-batch`, `R2ManagementCard.tsx`.

### Part B — Zip extraction for bulk upload

1. **New edge function** `extract-zip-to-r2`:
   - Accepts a `.zip` (chunked base64 or signed-URL upload for large files).
   - Uses `npm:fflate` (Deno-compatible, lightweight) to iterate entries.
   - Per entry: detect type (image / video / preset), compute SHA-256, dedupe-check (Part A), upload to R2, insert vault row.
   - Folder structure inside the zip becomes the subcategory (e.g. `lifestyle/photo1.jpg` → `Photos/lifestyle/...`).
   - Returns `{ uploaded, skipped, failed, files: [...] }`.
2. **UI**: new "Bulk Upload from ZIP" collapsible section in `R2ManagementCard` with drag-drop, optional default-subcategory override, per-file progress, summary toast.

Files: `supabase/functions/extract-zip-to-r2/index.ts` (new), `R2ManagementCard.tsx`.

### Open decisions

- **Subcategory rule for zips**: use folder names inside the zip, force a single chosen subcategory, or AI-categorize each file?
- **Duplicate behavior**: skip silently with count, skip and link to existing resource, or always upload and just warn?
- **Zip scope**: photos/videos only, or also include presets and documents?

Reply with your preferences (or "use sensible defaults" — I'll go with folder-name subcategories, skip-with-count, and photos+videos+presets) and I'll implement.

