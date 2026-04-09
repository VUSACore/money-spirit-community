
-- 1. Fix notifications INSERT: restrict to admin/moderator only
DROP POLICY IF EXISTS "authenticated_insert_notifications" ON notifications;
CREATE POLICY "notifications_insert_admin_mod" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (auth_user_role() = ANY(ARRAY['admin'::user_role, 'moderator'::user_role]));

-- 2. Fix user_badges INSERT: restrict to admin/moderator only
DROP POLICY IF EXISTS "user_badges_insert" ON user_badges;
CREATE POLICY "user_badges_insert_admin_mod" ON user_badges
  FOR INSERT TO authenticated
  WITH CHECK (auth_user_role() = ANY(ARRAY['admin'::user_role, 'moderator'::user_role]));

-- 3. Fix profiles: remove overly permissive SELECT that bypasses visible_in_directory
DROP POLICY IF EXISTS "Users can read all profiles" ON profiles;

-- 4. Fix threads: remove legacy USING:true policy and update threads_select
DROP POLICY IF EXISTS "Members can read threads" ON threads;
DROP POLICY IF EXISTS "threads_select" ON threads;
CREATE POLICY "threads_select" ON threads
  FOR SELECT TO authenticated
  USING (
    (hidden = false OR auth_user_role() = ANY(ARRAY['moderator'::user_role, 'admin'::user_role]))
    AND (
      NOT (SELECT requires_member FROM forums WHERE id = forum_id)
      OR auth_user_role() = ANY(ARRAY['member'::user_role, 'moderator'::user_role, 'admin'::user_role])
    )
  );

-- 5. Fix thread_replies: remove legacy USING:true policy and add proper check
DROP POLICY IF EXISTS "Members can read thread replies" ON thread_replies;
DROP POLICY IF EXISTS "thread_replies_select" ON thread_replies;
CREATE POLICY "thread_replies_select" ON thread_replies
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM threads t
      JOIN forums f ON f.id = t.forum_id
      WHERE t.id = thread_id
        AND (t.hidden = false OR auth_user_role() = ANY(ARRAY['moderator'::user_role, 'admin'::user_role]))
        AND (NOT f.requires_member OR auth_user_role() = ANY(ARRAY['member'::user_role, 'moderator'::user_role, 'admin'::user_role]))
    )
  );

-- 6. Also fix posts and lessons legacy USING:true policies
DROP POLICY IF EXISTS "Members can read posts" ON posts;
DROP POLICY IF EXISTS "Members can read lessons" ON lessons;
DROP POLICY IF EXISTS "Members can read forums" ON forums;
DROP POLICY IF EXISTS "Members can read rituals" ON rituals;
