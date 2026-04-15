
-- 1. Drop the overly permissive anon SELECT policy on profiles
DROP POLICY IF EXISTS "profiles_anon_select" ON public.profiles;

-- 2. Create a secure view exposing only safe display fields to anonymous users
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
  id,
  user_id,
  display_name,
  avatar_url,
  bio,
  location,
  show_bio,
  show_location,
  visible_in_directory,
  pathway_type,
  ritual_streak,
  created_at
FROM public.profiles
WHERE visible_in_directory = true;

-- 3. Grant anon access to the view only
GRANT SELECT ON public.public_profiles TO anon;

-- 4. Restrict realtime messages policy to scope by user for notifications
-- Drop the overly permissive policy and replace with scoped one
DROP POLICY IF EXISTS "realtime_authenticated_posts" ON realtime.messages;
CREATE POLICY "realtime_scoped_by_user"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    realtime.topic() NOT LIKE 'notifications-%'
    OR realtime.topic() = 'notifications-' || auth.uid()::text
  );
