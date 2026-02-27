

## Add "Pro Signup" Trigger Event for Direct Pro Purchases

### Problem
When a user signs up and purchases Pro directly (without first being a free user), the Stripe webhook handles the payment but never triggers a SureContact incoming webhook. There's no `pro_signup` trigger event available, so you can't set up a dedicated email sequence for direct Pro customers.

### Changes

#### 1. Add `pro_signup` to the trigger events list in the UI
Update `SureContactWebhooksCard.tsx` to include a new "Pro Signup" option in the `TRIGGER_EVENTS` array:
```
{ value: 'pro_signup', label: 'Pro Signup (Direct)' }
```

#### 2. Fire matching incoming webhooks from the Stripe webhook
In `supabase/functions/stripe-webhook/index.ts`, after the `checkout.session.completed` event is processed (where admin notifications already fire), add logic to:
- Query `surecontact_incoming_webhooks` for active webhooks with `trigger_event = 'pro_signup'`
- POST the customer's email and name to each matching webhook URL (with the secret as Bearer token)

This mirrors the same pattern already used for `free_signup` in the `surecontact-webhook` edge function, but triggered from the Stripe webhook instead.

### Files to modify
1. `src/components/admin/SureContactWebhooksCard.tsx` -- add `pro_signup` to TRIGGER_EVENTS
2. `supabase/functions/stripe-webhook/index.ts` -- fire `pro_signup` incoming webhooks on checkout completion

### Technical detail
The Stripe webhook already has access to the Supabase client (service role). The new code will:
- Fetch the customer's name from Stripe (if available)
- Query `surecontact_incoming_webhooks` for `trigger_event = 'pro_signup'` and `is_active = true`
- POST `{ email, first_name, last_name }` to each webhook URL with the `Authorization: Bearer <secret>` header
- Use `EdgeRuntime.waitUntil()` so it doesn't block the webhook response

