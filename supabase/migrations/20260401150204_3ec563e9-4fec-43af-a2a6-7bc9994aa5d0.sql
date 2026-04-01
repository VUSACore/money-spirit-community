
-- 1. Prevent users from escalating their own role via direct profile UPDATE
CREATE OR REPLACE FUNCTION public.prevent_role_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If the role column is being changed and the caller is not an admin, block it
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      NEW.role := OLD.role; -- silently revert the role change
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_self_update();

-- 2. Replace the overly broad public profiles SELECT policy with a restricted one
-- Drop the current public policy that exposes all columns to unauthenticated users
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;

-- Create a view for public directory access (limited columns only)
CREATE OR REPLACE VIEW public.public_profiles AS
  SELECT id, display_name, avatar_url, bio, location, show_in_directory, created_at, ritual_streak
  FROM public.profiles
  WHERE show_in_directory = true;

-- Allow authenticated users to see all profiles (needed for admin, members page, etc.)
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);
