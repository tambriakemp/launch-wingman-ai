

## Fix: Make SureContact Sync Fire for ALL Free Signups

### Problem
The `surecontact-webhook` call in `AuthContext.tsx` (line 383) is gated by:
```
if (storedUtmCampaign || storedRef) { ... }
```
If a user signs up without UTM or referral params (which is most users), the webhook is never called, so the incoming webhook for the free user email sequence never fires.

### Fix
Move the `surecontact-webhook` invocation **outside** the conditional so it always runs on signup. UTM/ref data will still be passed when available, but the call won't be skipped when they're absent.

### Changes

**File:** `src/contexts/AuthContext.tsx` (lines 381-395)

Replace the conditional block with an unconditional call:

```typescript
// Always sync new signup to SureContact (triggers incoming webhooks like free user sequence)
const storedUtmCampaign = localStorage.getItem('launchely_utm_campaign');
supabase.functions.invoke("surecontact-webhook", {
  body: {
    action: "sync_new_signup",
    email,
    first_name: firstName || '',
    last_name: lastName || '',
    ...(storedUtmCampaign && { utm_campaign: storedUtmCampaign }),
    ...(storedRef && { ref_source: storedRef }),
  },
}).catch((err) => console.error("Failed to sync signup to SureContact:", err));
if (storedUtmCampaign) localStorage.removeItem('launchely_utm_campaign');
```

The `storedRef` variable is already declared on line 373, so it remains available. The only change is removing the `if (storedUtmCampaign || storedRef)` guard.

### Files to modify
1. `src/contexts/AuthContext.tsx` -- remove the conditional gate around the surecontact-webhook call

