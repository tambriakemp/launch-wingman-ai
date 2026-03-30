

## Update SureContact Tags for Tier-Specific Tagging

### Problem
The current code only knows about two subscription states (`free` / `pro`) and two tags (`free-user` / `pro-subscriber`). You've renamed and added tags in SureContact:

| Old tag name | New tag name |
|---|---|
| `free-user` | `launchely: free-subscriber` |
| `pro-subscriber` | `launchely: pro-subscriber` |
| *(none)* | `launchely: vault-subscriber` |
| *(none)* | `launchely: advanced-subscriber` |

### Changes

#### 1. `supabase/functions/surecontact-webhook/index.ts`

**a) Expand `subscription_status` type from `'free' | 'pro'` to `'free' | 'content_vault' | 'pro' | 'advanced'`**

Update the `ContactPayload` interface and `getSubscriptionStatus` function.

**b) Update `getSubscriptionStatus` to return tier-specific status**

Use the price ID from the active Stripe subscription to determine the exact tier, matching the price IDs in `subscriptionTiers.ts`:
- `price_1StiayF2gaEq7adwKHe9AbQF` → `content_vault`
- `price_1SipMGF2gaEq7adwAGMICdO5` → `pro`
- `price_1TEznFF2gaEq7adwpTfGefLX` → `advanced`
- No subscription → `free`

**c) Update `manageTags` to use new tag names and remove all other tier tags**

Replace the simple `pro-subscriber` / `free-user` toggle with a mapping:
```text
free          → "launchely: free-subscriber"
content_vault → "launchely: vault-subscriber"
pro           → "launchely: pro-subscriber"
advanced      → "launchely: advanced-subscriber"
```

When applying the correct tag, detach all other tier tags (not just the "opposite").

**d) Update event tag for `subscription_started`**

Currently hardcoded to `upgraded-to-pro`. Remove this since there's no equivalent renamed tag — or keep `new-signup` as the only event tag. The `upgraded-to-pro` tag no longer exists in the config.

**e) Update hardcoded `'pro'` references in order sync and new signup flows**

- New signups already send `subscription_status: 'free'` — just update the tag name reference
- Order syncs that hardcode `subscription_status: 'pro'` should determine tier from the order's price ID

#### 2. `supabase/functions/stripe-webhook/index.ts`

**Update incoming webhook trigger events** — currently fires `pro_signup` for all paid checkouts. Optionally add `vault_signup` and `advanced_signup` triggers, or keep `pro_signup` as a catch-all for any paid subscription. This is a minor change and can be deferred.

### No migration needed
Tags are already in the `surecontact_config` table with the new names. No schema changes required.

