

## Reel Duration Control — Pre-Generation Settings Dialog

### Approach
When the user clicks "Generate Reel" or "Regenerate Reel", show a **dialog** before merging starts. The dialog offers two modes:

1. **Target Duration** (simple) — Pick a total reel length (7s, 10s, 15s, 30s, or "Full Length"). The system auto-divides time across clips evenly, trimming each to fit.
2. **Per-Clip Control** (advanced) — Shows each clip as a small thumbnail with a seconds input. User can set exact duration per clip. Defaults to each clip's full length.

A toggle or tabs switch between the two modes. "Full Length" is the default (current behavior — no trimming).

### How clip trimming works
During the Canvas playback loop, instead of playing each video to completion (`vid.onended`), use a per-clip `maxDuration` value:
- If `maxDuration` is set, start a timer on play and pause/end the video after that many seconds.
- The clip plays from the beginning and is cut at the specified time.
- For "Target Duration" mode: `perClipDuration = targetSeconds / numberOfClips`, capped at each clip's actual length.

### UI Design
The dialog includes:
- **Mode selector**: "Target Duration" / "Per-Clip" tabs
- **Target Duration tab**: Preset buttons (7s, 10s, 15s, 30s, Full Length) + estimated per-clip duration display
- **Per-Clip tab**: Grid of clip thumbnails (using scene images as proxies) with a number input (seconds) beside each. A "Reset to Full" button.
- **Generate button** at the bottom

### Files to change

| File | Change |
|------|--------|
| `src/components/ai-studio/ReelSettingsDialog.tsx` | **New** — Dialog component with duration mode selection, thumbnail grid, and per-clip inputs |
| `src/pages/AIStudio.tsx` | Show dialog on reel click instead of calling `handleCreateReel` directly. Pass clip durations array into `handleCreateReel`. Update the video playback loop to respect `maxDuration` per clip. |
| `src/components/ai-studio/StoryboardToolbar.tsx` | No changes needed — `onCreateReel` callback stays the same; the dialog is triggered from `AIStudio.tsx` |

### Technical details
- Clip trimming: In the sequential playback loop, replace `vid.onended` with a `setTimeout` that pauses the video and resolves the promise after `clipDurations[i]` seconds (or falls through to `onended` if duration >= actual length).
- Thumbnail source: Use `generatedMedia[i].imageUrl` (the scene image) as the thumbnail preview in the dialog.
- The dialog state lives in `AIStudio.tsx` as `showReelSettings: boolean` and `clipDurations: (number | null)[]`.

