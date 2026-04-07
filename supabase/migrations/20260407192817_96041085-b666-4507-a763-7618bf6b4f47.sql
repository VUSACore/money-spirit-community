
-- Add missing columns to badges table
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS emoji text NOT NULL DEFAULT '🌸';
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS color text NOT NULL DEFAULT '#C9941E';

-- Add title column to notifications
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title text;

-- Allow authenticated users to INSERT notifications (for cross-user notifications)
CREATE POLICY "authenticated_insert_notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow self-award of badges (for automated badge awarding)
DROP POLICY IF EXISTS "user_badges_insert" ON public.user_badges;
CREATE POLICY "user_badges_insert"
  ON public.user_badges FOR INSERT TO authenticated
  WITH CHECK (true);
