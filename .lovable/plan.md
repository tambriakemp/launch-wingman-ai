

## SureContact Incoming Webhooks Manager

### What you'll get
A new card on the Config tab where you can:
- Add a SureContact incoming webhook URL with a friendly name (e.g., "Free User Sequence", "Pro Onboarding")
- Assign a list from your synced SureContact lists
- Assign one or more tags from your synced SureContact tags
- Edit or delete existing webhook configurations
- See all configured webhooks at a glance

Then, when the code needs to trigger a webhook (e.g., on free signup), it looks up the webhook config by name from the database instead of having a hardcoded URL.

### Changes

#### 1. New database table: `surecontact_incoming_webhooks`
Stores each webhook configuration with columns:
- `id` (uuid, primary key)
- `name` (text) -- friendly label like "Free User Sequence"
- `webhook_url` (text) -- the full SureContact incoming webhook URL
- `list_id` (text, nullable) -- the surecontact_uuid of the assigned list
- `tag_ids` (text array) -- array of surecontact_uuid values for assigned tags
- `is_active` (boolean, default true)
- `created_at`, `updated_at` (timestamps)

RLS: admin-only for all operations.

#### 2. New UI component: `SureContactWebhooksCard`
A card on the Config tab with:
- A table/list showing all configured webhooks (name, URL truncated, assigned list name, tag badges, active toggle)
- "Add Webhook" button that opens a dialog/form with:
  - Name input
  - Webhook URL input
  - List dropdown (populated from `surecontact_config` where `config_type = 'list'`)
  - Tag multi-select (populated from `surecontact_config` where `config_type = 'tag'`)
- Edit and delete buttons on each row
- Active/inactive toggle

#### 3. Update `ConfigTab.tsx`
Import and render the new `SureContactWebhooksCard` component between the existing SureContact Configuration and Sync cards.

#### 4. Update edge functions to use webhook configs
Modify the `surecontact-webhook` edge function's `sync_new_signup` handler to:
- Query `surecontact_incoming_webhooks` for active webhooks that should fire on signup (can match by name convention or add a `trigger_event` column)
- POST to each matching webhook URL with the user's name and email
- This replaces the need to hardcode webhook URLs

### Technical details

**Table migration:**
```sql
CREATE TABLE public.surecontact_incoming_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  webhook_url text NOT NULL,
  list_id text,
  tag_ids text[] DEFAULT '{}',
  trigger_event text NOT NULL DEFAULT 'manual',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.surecontact_incoming_webhooks ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can manage webhooks" ON public.surecontact_incoming_webhooks
  FOR ALL USING (has_role(auth.uid(), 'admin'));
```

The `trigger_event` column lets you tag webhooks with when they should fire: `free_signup`, `pro_upgrade`, `plan_cancelled`, `manual`, etc. The edge function queries for active webhooks matching the event and fires them automatically.

**Files to create:**
1. `src/components/admin/SureContactWebhooksCard.tsx` -- the UI card component

**Files to modify:**
1. `src/components/admin/ConfigTab.tsx` -- add the new card
2. `supabase/functions/surecontact-webhook/index.ts` -- query webhook configs and POST to matching URLs on signup

