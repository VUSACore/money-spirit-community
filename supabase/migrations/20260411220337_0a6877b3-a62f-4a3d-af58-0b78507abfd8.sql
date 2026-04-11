
-- STEP 1: Create family legacy tables
-- Note: creator_id / member_id / completed_by / user_id store auth.uid() values
-- matching the existing codebase pattern (posts.author_id, etc.)

CREATE TABLE IF NOT EXISTS family_circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL,
  circle_name TEXT NOT NULL,
  circle_type TEXT NOT NULL CHECK (circle_type IN ('mother_daughter', 'sibling', 'multi_gen')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS family_circle_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES family_circles(id) ON DELETE CASCADE,
  member_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('primary', 'secondary')),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(circle_id, member_id)
);

CREATE TABLE IF NOT EXISTS family_rituals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_circle_id UUID NOT NULL REFERENCES family_circles(id) ON DELETE CASCADE,
  ritual_id UUID REFERENCES rituals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  reflection_prompt TEXT,
  week_of DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS family_ritual_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_ritual_id UUID NOT NULL REFERENCES family_rituals(id) ON DELETE CASCADE,
  completed_by UUID NOT NULL,
  reflection TEXT,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(family_ritual_id, completed_by)
);

CREATE TABLE IF NOT EXISTS legacy_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('inheritance', 'property', 'education_fund', 'business', 'retirement')),
  title TEXT NOT NULL,
  target_amount DECIMAL(12,2),
  currency TEXT DEFAULT 'AUD',
  notes TEXT,
  target_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 2: Add is_legacy_enabled to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_legacy_enabled BOOLEAN DEFAULT false;

-- STEP 3: Enable RLS on all new tables
ALTER TABLE family_circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_rituals ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_ritual_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE legacy_goals ENABLE ROW LEVEL SECURITY;

-- family_circles: creator can do everything
CREATE POLICY "family_circles_creator" ON family_circles
  FOR ALL USING (auth.uid() = creator_id);

-- family_circles: members can read
CREATE POLICY "family_circles_member_read" ON family_circles
  FOR SELECT USING (
    id IN (SELECT circle_id FROM family_circle_members WHERE member_id = auth.uid())
  );

-- family_circles: admin can do everything
CREATE POLICY "family_circles_admin" ON family_circles
  FOR ALL USING (auth_user_role() = 'admin'::user_role);

-- family_circle_members: members can read their own circle memberships, creators can read all
CREATE POLICY "circle_members_own" ON family_circle_members
  FOR SELECT USING (
    member_id = auth.uid() OR
    circle_id IN (SELECT id FROM family_circles WHERE creator_id = auth.uid())
  );

-- family_circle_members: creator can manage members
CREATE POLICY "circle_members_creator_manage" ON family_circle_members
  FOR ALL USING (
    circle_id IN (SELECT id FROM family_circles WHERE creator_id = auth.uid())
  );

-- family_circle_members: admin access
CREATE POLICY "circle_members_admin" ON family_circle_members
  FOR ALL USING (auth_user_role() = 'admin'::user_role);

-- family_rituals: circle members and creators can read
CREATE POLICY "family_rituals_read" ON family_rituals
  FOR SELECT USING (
    family_circle_id IN (SELECT circle_id FROM family_circle_members WHERE member_id = auth.uid())
    OR
    family_circle_id IN (SELECT id FROM family_circles WHERE creator_id = auth.uid())
  );

-- family_rituals: creator can manage
CREATE POLICY "family_rituals_creator_manage" ON family_rituals
  FOR ALL USING (
    family_circle_id IN (SELECT id FROM family_circles WHERE creator_id = auth.uid())
  );

-- family_rituals: admin access
CREATE POLICY "family_rituals_admin" ON family_rituals
  FOR ALL USING (auth_user_role() = 'admin'::user_role);

-- family_ritual_completions: own completions only
CREATE POLICY "family_completions_own" ON family_ritual_completions
  FOR ALL USING (auth.uid() = completed_by);

-- family_ritual_completions: admin access
CREATE POLICY "family_completions_admin" ON family_ritual_completions
  FOR ALL USING (auth_user_role() = 'admin'::user_role);

-- legacy_goals: own goals only
CREATE POLICY "legacy_goals_own" ON legacy_goals
  FOR ALL USING (auth.uid() = user_id);

-- legacy_goals: admin access
CREATE POLICY "legacy_goals_admin" ON legacy_goals
  FOR ALL USING (auth_user_role() = 'admin'::user_role);
