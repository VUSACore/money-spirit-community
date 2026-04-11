
-- Step 1: Add suspended columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_reason TEXT;

-- Step 2: Create platform_settings table
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_admin_select" ON platform_settings
  FOR SELECT USING (auth_user_role() = 'admin'::user_role);

CREATE POLICY "settings_admin_insert" ON platform_settings
  FOR INSERT WITH CHECK (auth_user_role() = 'admin'::user_role);

CREATE POLICY "settings_admin_update" ON platform_settings
  FOR UPDATE USING (auth_user_role() = 'admin'::user_role);

CREATE POLICY "settings_admin_delete" ON platform_settings
  FOR DELETE USING (auth_user_role() = 'admin'::user_role);

-- Seed default values
INSERT INTO platform_settings (key, value) VALUES
  ('ai_engine_enabled', 'true'),
  ('fms_bridge_enabled', 'true'),
  ('legacy_features_enabled', 'false'),
  ('notifications_enabled', 'true'),
  ('platform_name', 'Money Spirit'),
  ('logo_url', '')
ON CONFLICT (key) DO NOTHING;

-- Step 3: Add audit_logs insert policy for admin/moderator
CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT WITH CHECK (auth_user_role() IN ('admin'::user_role, 'moderator'::user_role));

-- Step 4: Add admin select policy for profiles (so admin can see all users including non-directory)
CREATE POLICY "profiles_admin_select" ON profiles
  FOR SELECT USING (auth_user_role() = 'admin'::user_role);

-- Step 5: Add admin update policy for profiles (so admin can suspend/update any profile)
CREATE POLICY "profiles_admin_update" ON profiles
  FOR UPDATE USING (auth_user_role() = 'admin'::user_role);

-- Step 6: Add admin select on content_reports (redundant safety with existing policies)
-- Already has policies from prior migration, skip

-- Step 7: Add courses delete policy for admin
CREATE POLICY "courses_delete" ON courses
  FOR DELETE USING (auth_user_role() = 'admin'::user_role);

-- Step 8: Add lessons admin CUD policies
CREATE POLICY "lessons_insert" ON lessons
  FOR INSERT WITH CHECK (auth_user_role() = 'admin'::user_role);

CREATE POLICY "lessons_update" ON lessons
  FOR UPDATE USING (auth_user_role() = 'admin'::user_role);

CREATE POLICY "lessons_delete" ON lessons
  FOR DELETE USING (auth_user_role() = 'admin'::user_role);

-- Step 9: Add rituals delete policy
CREATE POLICY "rituals_delete" ON rituals
  FOR DELETE USING (auth_user_role() = 'admin'::user_role);

-- Step 10: Admin select for event_tickets (so admin can see all tickets for attendee lists)
CREATE POLICY "event_tickets_admin_select" ON event_tickets
  FOR SELECT USING (auth_user_role() = 'admin'::user_role);
