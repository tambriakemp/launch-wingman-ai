

## Hybrid Video Generation: Credits + BYOK Integration

### Overview
Implement a hybrid billing model for video generation in AI Studio:
- **Pro users** get a monthly allowance of free video generations (e.g., 10/month)
- **Credit packs** available for purchase via Stripe for additional generations
- **BYOK option** for power users who want to use their own fal.ai API key

### Architecture

```text
User clicks "Generate Video"
        |
        v
  [Edge Function: generate-video]
        |
        +-- Check: Does user have their own fal.ai key in profiles?
        |     YES --> Use their key (no credit deduction)
        |     NO  --> Check credit balance
        |              |
        |              +-- Has credits (free monthly or purchased)?
        |              |     YES --> Call fal.ai with platform key, deduct 1 credit
        |              |     NO  --> Return error: "No credits remaining"
        |              
        v
  [fal.ai API: MiniMax image-to-video]
        |
        v
  Return video URL to client
```

### What Gets Built

**1. Database: `video_credits` table**
- Tracks each user's credit balance, monthly free allowance, and reset date
- Columns: `user_id`, `balance`, `monthly_free_remaining`, `monthly_reset_at`
- Auto-created row when a user first generates video
- RLS: users can only read their own row

**2. Database: `video_credit_transactions` table**
- Audit log of credit usage and purchases
- Columns: `user_id`, `amount`, `type` (free_monthly, purchased, used), `description`, `created_at`

**3. Edge Function: `generate-video`**
- Accepts: scene image URL, video prompt, aspect ratio
- Checks for user's own fal.ai key first (from profiles table or a new `user_api_keys` table)
- If no BYOK key, checks and deducts credits
- Calls fal.ai MiniMax (Hailuo) image-to-video endpoint
- Returns video URL
- Handles polling (fal.ai is async -- submit, then poll for result)

**4. Edge Function: `purchase-video-credits`**
- Creates a Stripe checkout session for credit packs
- Packs: 10 credits ($5), 25 credits ($10), 50 credits ($18)
- On success, credits are added to user's balance (via Stripe webhook or success callback)

**5. Settings Page: "AI Studio" section**
- Show current credit balance and monthly free remaining
- "Buy Credits" button with pack options
- Optional: "Use your own fal.ai API key" input field with save/clear

**6. AI Studio UI Updates**
- Update `processQueue` to call the `generate-video` edge function instead of throwing "coming soon"
- Show credit balance in the toolbar
- Display video in SceneCard when generated
- Show appropriate error when credits are exhausted with a link to buy more

**7. Wire up video display in SceneCard**
- Render `<video>` element when `videoUrl` is available
- Play/pause controls

### Technical Details

**fal.ai Integration:**
- Endpoint: `https://queue.fal.run/fal-ai/minimax-video/image-to-video`
- Cost: ~$0.10-0.20 per generation
- Async flow: POST to submit, then poll `/requests/{id}/status` until complete
- Secret needed: `FAL_KEY` (platform-level, stored as backend secret)

**Credit Logic (in generate-video edge function):**
```text
1. Get user from auth token
2. Check user_api_keys for fal.ai key
   - If found: use it, skip credit check
3. Check video_credits for user
   - If no row: create one with monthly_free = 10
   - If monthly_reset_at < now: reset monthly_free to 10
   - If monthly_free > 0: deduct 1, proceed
   - Else if balance > 0: deduct 1, proceed
   - Else: return 402 "No credits"
4. Call fal.ai, return video URL
5. Log transaction
```

**Stripe Credit Packs:**
- Create 3 Stripe products/prices for credit packs
- Use one-off payment mode (not subscription)
- On payment success, add credits to user's balance

**Monthly Reset:**
- Pro users get 10 free credits/month
- Reset tracked via `monthly_reset_at` timestamp
- Checked and reset lazily on each generation request

### Files to Create/Modify

| File | Action |
|------|--------|
| `video_credits` table | Create (migration) |
| `video_credit_transactions` table | Create (migration) |
| `user_api_keys` table | Create (migration) |
| `supabase/functions/generate-video/index.ts` | Create |
| `supabase/functions/purchase-video-credits/index.ts` | Create |
| `src/pages/AIStudio.tsx` | Modify (wire generate-video call) |
| `src/components/ai-studio/SceneCard.tsx` | Modify (render video) |
| `src/pages/Settings.tsx` | Modify (add AI Studio credits section + BYOK) |
| `src/hooks/useVideoCredits.ts` | Create (query credit balance) |
| `supabase/config.toml` | Add new function entries |

### Prerequisite
You'll need to sign up at **fal.ai** and get an API key. I'll prompt you to add it as a backend secret (`FAL_KEY`) before building the edge function.

