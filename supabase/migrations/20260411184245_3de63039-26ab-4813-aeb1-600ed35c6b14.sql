
-- Add course_id column to lesson_progress
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE CASCADE;

-- Add updated_at column to lesson_progress
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Drop old restrictive policies and replace with a single ALL policy
DROP POLICY IF EXISTS "lesson_progress_insert" ON lesson_progress;
DROP POLICY IF EXISTS "lesson_progress_select" ON lesson_progress;
DROP POLICY IF EXISTS "lesson_progress_update" ON lesson_progress;

CREATE POLICY "lesson_progress_own" ON lesson_progress
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow admins to read all lesson_progress for analytics
CREATE POLICY "lesson_progress_admin_select" ON lesson_progress
  FOR SELECT USING (auth_user_role() = 'admin'::user_role);

-- Allow admins to update course_enrollments completed_at
DROP POLICY IF EXISTS "course_enrollments_update_own" ON course_enrollments;
CREATE POLICY "course_enrollments_update_own" ON course_enrollments
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
