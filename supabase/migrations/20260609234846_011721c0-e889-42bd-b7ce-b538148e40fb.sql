
-- 1. campaign_conversions: lock down INSERT to service_role only
DROP POLICY IF EXISTS "Service role can insert conversions" ON public.campaign_conversions;
CREATE POLICY "Service role can insert conversions"
  ON public.campaign_conversions
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 2. content-media storage: drop broad authenticated UPDATE/DELETE policies
DROP POLICY IF EXISTS "Authenticated users can update content-media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from content-media" ON storage.objects;
-- also drop the duplicate public read policy (one is enough; the bucket is public)
DROP POLICY IF EXISTS "Public read access to content-media" ON storage.objects;

-- 3. platform_settings: restrict the all-roles "Service role full access" policy to service_role only
DROP POLICY IF EXISTS "Service role full access" ON public.platform_settings;
CREATE POLICY "Service role full access"
  ON public.platform_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
-- Allow authenticated admins to read settings (admin UI uses anon key + JWT)
CREATE POLICY "Admins can read platform settings"
  ON public.platform_settings
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
