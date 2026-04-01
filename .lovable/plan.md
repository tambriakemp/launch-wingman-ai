

## Force MP4 Download for Reels

### Problem
`MediaRecorder` in most browsers only supports WebM (not MP4). The current code checks `isTypeSupported('video/mp4')` but it almost always fails, resulting in `.webm` files.

### Solution
Use **FFmpeg WASM** to convert the WebM blob to MP4 client-side after recording completes.

### Changes

**Install dependency**
- `@ffmpeg/ffmpeg` and `@ffmpeg/util`

**`src/pages/AIStudio.tsx`** (~lines 652-680)

After `recorder.stop()` and getting the WebM blob:

1. Import and load FFmpeg WASM (`@ffmpeg/ffmpeg`)
2. Write the WebM blob to FFmpeg's virtual filesystem
3. Run `ffmpeg -i input.webm -c:v libx264 -preset ultrafast -pix_fmt yuv420p output.mp4`
4. Read the resulting MP4 file
5. Upload the MP4 blob (with `contentType: 'video/mp4'`) and use `.mp4` extension
6. Remove the format detection logic — always output MP4 regardless of `MediaRecorder` format

Additionally update the progress indicator to show "Converting to MP4..." during the conversion step (between merge completion and upload).

### Technical notes
- FFmpeg WASM loads ~30MB on first use (cached afterward). A loading message should inform the user.
- The `MediaRecorder` still records in WebM (whatever the browser supports), but the final output is always MP4.
- `@ffmpeg/ffmpeg` v0.12+ uses SharedArrayBuffer which requires specific headers. If that's an issue, we can use the single-threaded build (`@ffmpeg/ffmpeg/dist/umd/ffmpeg.js`).

