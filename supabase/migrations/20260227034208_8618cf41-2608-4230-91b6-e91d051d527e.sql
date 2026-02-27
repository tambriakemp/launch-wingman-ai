
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

CREATE POLICY "Admins can manage webhooks" ON public.surecontact_incoming_webhooks
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_surecontact_incoming_webhooks_updated_at
  BEFORE UPDATE ON public.surecontact_incoming_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
