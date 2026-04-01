
-- Fix the security definer view issue
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS
  SELECT id, display_name, avatar_url, bio, location, show_in_directory, created_at, ritual_streak
  FROM public.profiles
  WHERE show_in_directory = true;
