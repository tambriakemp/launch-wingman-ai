

## Upgrade AI Usage Card to "AI Settings" Hub + Credit Purchases

### What Changes

**1. Rename and expand the AiUsageCard into an "AI Settings" card with three sections:**

- **Usage** -- Current month's AI call stats (existing functionality), plus a new "AI Studio" sub-section showing video generation count from `video_credit_transactions`
- **Video Credits** -- Display current balance (monthly free remaining + purchased), with "Buy Credits" button offering 3 packs
- **API Key (BYOK)** -- Input field to save/clear a personal fal.ai key in the `user_api_keys` table

**2. Track AI Studio usage separately**

The existing `ai_usage_logs` table tracks text-based AI calls (content drafts, talking points, etc.). Video generation is already tracked in `video_credit_transactions`. The new AI Settings card will query both:
- `ai_usage_logs` for text AI usage (existing hook)
- `video_credit_transactions` for video generation count this month (new query)

No new tables needed -- the data is already being logged.

**3. Buy Credits via Stripe (one-time payments)**

Create a `purchase-video-credits` edge function that creates a Stripe Checkout session for credit packs. On the success callback, a `fulfill-video-credits` edge function (or webhook) adds credits to the user's `video_credits.balance`.

**Pricing recommendation based on fal.ai costs:**
- fal.ai MiniMax video costs ~$0.10-0.20 per generation
- Suggested credit packs with healthy margin:
  - **10 credits -- $4.99** (~$0.50/video, ~3x markup)
  - **25 credits -- $9.99** (~$0.40/video, volume discount)
  - **50 credits -- $17.99** (~$0.36/video, best value)

These prices feel fair for end users while covering your costs with room for profit.

### Technical Details

**Files to modify:**

| File | Change |
|------|--------|
| `src/components/settings/AiUsageCard.tsx` | Rename to `AiSettingsCard.tsx`. Add three collapsible sections: Usage, Video Credits, API Key. Query `video_credit_transactions` for studio usage count. Add BYOK input that saves to `user_api_keys`. Add Buy Credits buttons. |
| `src/pages/Settings.tsx` | Update import from `AiUsageCard` to `AiSettingsCard` |
| `src/hooks/useVideoCredits.ts` | Create hook to fetch `video_credits` balance and `video_credit_transactions` count |

**New files:**

| File | Purpose |
|------|---------|
| `supabase/functions/purchase-video-credits/index.ts` | Creates Stripe Checkout session (mode: "payment") for selected credit pack. Uses existing `STRIPE_SECRET_KEY`. |
| `supabase/functions/fulfill-video-credits/index.ts` | Called from the success page with the Checkout session ID. Verifies payment via Stripe API, then adds credits to `video_credits.balance` and logs in `video_credit_transactions`. |

**Credit pack Stripe products:**
- Create 3 Stripe products/prices using Stripe tools before building the edge function
- These price IDs get hardcoded into `purchase-video-credits`

**BYOK flow:**
- User enters fal.ai key in Settings
- Saved to `user_api_keys` table (service: "fal_ai")
- `generate-video` edge function already checks this table first
- Show masked key with a "Clear" button when saved

**Success page flow:**
- After Stripe checkout, redirect to `/settings?credits_success=true&session_id={CHECKOUT_SESSION_ID}`
- Settings page detects this param, calls `fulfill-video-credits` to verify and add credits
- Shows success toast

