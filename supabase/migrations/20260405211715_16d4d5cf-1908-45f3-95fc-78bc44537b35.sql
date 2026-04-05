
-- Fix 1: profiles_update — prevent role self-escalation
DROP POLICY IF EXISTS profiles_update ON profiles;
CREATE POLICY profiles_update ON profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND (
      role = (SELECT p.role FROM profiles p WHERE p.user_id = auth.uid())
      OR auth_user_role() = 'admin'::user_role
    )
  );

-- Fix 2: events — tighten SELECT policies
DROP POLICY IF EXISTS "Members can read events" ON events;
DROP POLICY IF EXISTS events_select ON events;
CREATE POLICY events_select ON events
  FOR SELECT TO authenticated
  USING (published = true OR auth_user_role() IN ('moderator'::user_role, 'admin'::user_role));
