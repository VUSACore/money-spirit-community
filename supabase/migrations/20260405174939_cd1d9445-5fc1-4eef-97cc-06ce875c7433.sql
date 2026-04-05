-- Remove user UPDATE access to memberships entirely
DROP POLICY IF EXISTS memberships_update ON public.memberships;

-- Create admin-only update policy for memberships
CREATE POLICY memberships_admin_update ON public.memberships
  FOR UPDATE TO authenticated
  USING (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');