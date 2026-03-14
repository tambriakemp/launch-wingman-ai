

## Fix: Stripe Webhook Signature Verification + 100% Coupon Handling

### Problem
Two issues found:

1. **Webhook failing** — The logs show: `"SubtleCryptoProvider cannot be used in a synchronous context. Use await constructEventAsync(...)"`. The current code uses `stripe.webhooks.constructEvent()` (sync), but Deno's crypto is async-only. This means ALL Stripe webhooks are being rejected with a 400, so the Skool access webhook never fires.

2. **100% off coupons** — When a coupon covers the full amount, Stripe still fires `checkout.session.completed` but the webhook rejection above prevents processing.

### Fix

**File: `supabase/functions/stripe-webhook/index.ts`** (line 198)
- Replace `stripe.webhooks.constructEvent(body, signature, webhookSecret)` with `await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)`
- This is a one-line change that fixes all webhook processing

**File: `src/pages/AITwinFormula.tsx`**
- Update the price display from `$27` to `$27` (no change needed — already correct)
- No other frontend changes needed

### What this fixes
- All Stripe webhooks will be properly verified and processed
- After successful payment (including 100% off coupons), the Skool community access webhook will fire with the buyer's email
- Admin notifications and SureContact syncs will also start working

