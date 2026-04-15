
-- Recreate the view with SECURITY INVOKER
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true) AS
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

-- Re-grant anon access
GRANT SELECT ON public.public_profiles TO anon;
