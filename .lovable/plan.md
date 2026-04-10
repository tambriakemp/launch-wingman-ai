

# Lower Default Video Duration from 10s to 7s

## Why
Fal.ai charges Kling video generation **per second of output**. Reducing from 10s to 7s saves ~30% on each generation — meaningful savings at scale.

## Changes

### 1. Edge function (`supabase/functions/generate-video/index.ts`)
- Change the single-prompt default `duration` from `"10"` to `"7"` (line ~142)

### 2. Frontend references (if any)
- Check and update any UI text or constants that reference "10 seconds" to say "7 seconds"

That's it — a one-line backend change plus any UI label updates.

