

## Fix: SureContact Incoming Webhook Authentication and Deployment

### Problem
Two issues are preventing the webhook from firing:
1. The `surecontact-webhook` edge function shows zero logs, indicating it was never called during the test signup -- it needs to be redeployed.
2. The incoming webhook POST does not include the webhook secret key for authentication. SureContact provides both a URL and a secret key -- the secret must be sent as an authorization header.

### Changes

#### 1. Add webhook secret key storage to the database
Update the `surecontact_incoming_webhooks` table to include a `webhook_secret` column so each webhook can store its own secret key.

```sql
ALTER TABLE public.surecontact_incoming_webhooks
ADD COLUMN webhook_secret text;
```

#### 2. Update the admin UI to accept the secret key
In `SureContactWebhooksCard.tsx`, add a "Webhook Secret" input field to the add/edit form so you can paste the secret key from SureContact.

#### 3. Update the edge function to include authentication
Modify the incoming webhook POST in `surecontact-webhook/index.ts` to:
- Query the `webhook_secret` column alongside the URL
- Include the secret as an `Authorization: Bearer <secret>` header (or whichever format SureContact expects) when POSTing to the incoming webhook URL

```typescript
const { data: incomingWebhooks } = await supabase
  .from('surecontact_incoming_webhooks')
  .select('id, name, webhook_url, webhook_secret')
  .eq('trigger_event', 'free_signup')
  .eq('is_active', true);

for (const wh of incomingWebhooks) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (wh.webhook_secret) {
    headers['Authorization'] = `Bearer ${wh.webhook_secret}`;
  }
  await fetch(wh.webhook_url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, first_name, last_name }),
  });
}
```

#### 4. Redeploy the edge function
Ensure the `surecontact-webhook` edge function is redeployed so all changes take effect.

### Files to modify
1. Database migration -- add `webhook_secret` column
2. `src/components/admin/SureContactWebhooksCard.tsx` -- add secret input field
3. `supabase/functions/surecontact-webhook/index.ts` -- include secret in webhook POST headers

