-- Fix: recreate view as security invoker
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
  WITH (security_invoker = true)
  AS SELECT id, display_name, avatar_url, bio, location
     FROM public.profiles
     WHERE show_in_directory = true;

GRANT SELECT ON public.public_profiles TO authenticated;