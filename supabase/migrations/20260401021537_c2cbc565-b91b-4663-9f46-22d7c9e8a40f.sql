-- 1. Fix profile column oversharing
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;

-- Owner can see their own full profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Public-safe view for directory/community features
CREATE OR REPLACE VIEW public.public_profiles AS
  SELECT id, display_name, avatar_url, bio, location
  FROM public.profiles
  WHERE show_in_directory = true;

-- Grant authenticated users access to the view
GRANT SELECT ON public.public_profiles TO authenticated;

-- 2. Fix Realtime channel authorization
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "realtime_authenticated_posts" ON realtime.messages
  FOR SELECT TO authenticated
  USING (true);