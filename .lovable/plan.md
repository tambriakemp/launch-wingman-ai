
## Stripe Account Migration Plan

### Products to recreate in the new Stripe account

Pulled from the current account. All USD.

| # | Product | Amount | Type | Current Price ID |
|---|---|---|---|---|
| 1 | Content Vault | $7.00 | Subscription (monthly) | `price_1StiayF2gaEq7adwKHe9AbQF` |
| 2 | Pro | $49.00 | Subscription (monthly) | `price_1TEznFF2gaEq7adwpTfGefLX` |
| 3 | Legacy Pro ($25) | $25.00 | Subscription (monthly) | `price_1SipMGF2gaEq7adwAGMICdO5` |
| 4 | AI Twin | $27.00 | One-time | `price_1TAfjcF2gaEq7adw7vG5yzn5` |
| 5 | Video Credits — 10 | $4.99 | One-time | `price_1T6ccEF2gaEq7adwjWGNlVGy` |
| 6 | Video Credits — 25 | $9.99 | One-time | `price_1T6cdJF2gaEq7adwYb8ikBfa` |
| 7 | Video Credits — 50 | $17.99 | One-time | `price_1T6cdzF2gaEq7adwIQ3V6Wr0` |

Note: Legacy Pro $25 is preserved only so existing legacy subscribers (staying on the old account) are still recognized. Since they remain on the old account, the new legacy price won't actually be used — but I'll still recreate it so admin tooling doesn't break if you ever re-import.

### Migration steps

1. **You update the Stripe secret key** to the new account via Settings → Project Secrets (`STRIPE_SECRET_KEY`). Also update `STRIPE_WEBHOOK_SECRET` after step 4.
2. **I recreate the 7 products/prices** in the new account using `stripe--create_stripe_product_and_price` and capture the new IDs.
3. **I update every hardcoded price ID** across the codebase (see Technical section).
4. **You create the webhook endpoint** in the new Stripe dashboard pointing to the existing `stripe-webhook` URL, then paste the new signing secret into `STRIPE_WEBHOOK_SECRET`.
5. **You re-activate the Customer Portal** in the new Stripe dashboard (required by `customer-portal` edge function).
6. **Smoke test**: a $7 Vault checkout end-to-end to confirm checkout → webhook → subscription state updates.

### Out of scope (you handle separately)
- Existing active subscribers stay on the old account billing until they churn.
- Coupons/promo codes — list them and I can recreate after the swap if needed.
- SureContact tag mappings — the new price IDs will be wired into `surecontact-webhook` automatically as part of step 3.

### Technical: files that need price-ID updates

Edge functions:
- `supabase/functions/admin-list-users/index.ts`
- `supabase/functions/admin-manage-subscription/index.ts`
- `supabase/functions/check-subscription/index.ts`
- `supabase/functions/complete-subscription-checkout/index.ts`
- `supabase/functions/create-payment-intent-only/index.ts`
- `supabase/functions/create-checkout/index.ts`
- `supabase/functions/create-ai-twin-checkout/index.ts`
- `supabase/functions/purchase-video-credits/index.ts`
- `supabase/functions/surecontact-webhook/index.ts`

Frontend:
- `src/lib/subscriptionTiers.ts`
- `src/components/settings/AiSettingsCard.tsx`

### Risks
- Any in-flight checkout sessions started against the old key will fail after the swap — brief downtime window during step 1–3.
- If anything in the DB stores price IDs as text (e.g. `surecontact_config`, `payment_config`), those rows will need updating too. I'll query for that during build and flag it.
