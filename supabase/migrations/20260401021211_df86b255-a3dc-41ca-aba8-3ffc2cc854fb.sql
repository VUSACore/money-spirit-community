-- 1. Fix memberships: restrict select to authenticated only
DROP POLICY IF EXISTS "memberships_select_own" ON public.memberships;
CREATE POLICY "memberships_select_own" ON public.memberships
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 2. Fix profiles role escalation: create a safe update policy
-- First create a security definer function to check protected fields
CREATE OR REPLACE FUNCTION public.profiles_update_check()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent users from changing protected fields
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Cannot modify role field';
  END IF;
  IF NEW.suspended_at IS DISTINCT FROM OLD.suspended_at THEN
    RAISE EXCEPTION 'Cannot modify suspended_at field';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_protect_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_update_check();

-- 3. Fix profiles public exposure: restrict select
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;

-- Authenticated users can see all profiles
CREATE POLICY "profiles_select_authenticated" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

-- 4. Fix handle_new_user search path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;