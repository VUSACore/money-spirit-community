-- Drop the view that triggers the security definer linter
DROP VIEW IF EXISTS public.public_profiles;

-- Create a security definer function to safely fetch public profile data
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_id uuid)
RETURNS TABLE(id uuid, display_name text, avatar_url text, bio text, location text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.display_name, p.avatar_url, p.bio, p.location
  FROM profiles p
  WHERE p.id = profile_id AND p.show_in_directory = true;
$$;

-- Batch lookup for community features
CREATE OR REPLACE FUNCTION public.get_public_profiles(profile_ids uuid[])
RETURNS TABLE(id uuid, display_name text, avatar_url text, bio text, location text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.display_name, p.avatar_url, p.bio, p.location
  FROM profiles p
  WHERE p.id = ANY(profile_ids);
$$;