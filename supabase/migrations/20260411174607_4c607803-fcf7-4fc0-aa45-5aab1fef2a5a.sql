
-- Add icon_slug column to badges
ALTER TABLE badges ADD COLUMN IF NOT EXISTS icon_slug text;

-- Seed the 10 badges (upsert on slug)
INSERT INTO badges (slug, name, description, icon_slug, color, emoji)
VALUES
  ('first-ritual', 'First Ritual', 'Completed your very first money ritual. Your journey begins.', 'sparkles', '#27AE8F', '✨'),
  ('ritual-streak-5', '5 Week Streak', 'Completed 5 rituals in a row. Consistency is your superpower.', 'flame', '#E8845C', '🔥'),
  ('ritual-streak-10', '10 Week Streak', 'Ten weeks of dedication. You are building something real.', 'flame', '#E8845C', '🔥'),
  ('ritual-streak-25', '25 Week Streak', 'Twenty-five weeks of unbroken practice. Truly extraordinary.', 'trophy', '#C9941E', '🏆'),
  ('first-post', 'First Post', 'Shared your voice with the Money Spirit community for the first time.', 'message-circle', '#5B8DB8', '💬'),
  ('first-win', 'First Win', 'Celebrated your first financial win. Every milestone matters.', 'star', '#C9941E', '⭐'),
  ('course-complete', 'Course Graduate', 'Completed your first full course. Knowledge is power.', 'graduation-cap', '#9B59B6', '🎓'),
  ('founding-member', 'Founding Member', 'One of the first 100 annual members. A true pioneer of Money Spirit.', 'crown', '#C9941E', '👑'),
  ('community-star', 'Community Star', 'Received 50 reactions on your posts. The community loves your energy.', 'heart', '#E8845C', '❤️'),
  ('archetype-unlock', 'Archetype Revealed', 'Discovered your money archetype and began your personalised journey.', 'compass', '#27AE8F', '🧭')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_slug = EXCLUDED.icon_slug,
  color = EXCLUDED.color,
  emoji = EXCLUDED.emoji;

-- Create award_badge function
CREATE OR REPLACE FUNCTION public.award_badge(p_user_id uuid, p_badge_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_badge_id uuid;
BEGIN
  SELECT id INTO v_badge_id FROM badges WHERE slug = p_badge_slug;
  IF v_badge_id IS NOT NULL THEN
    INSERT INTO user_badges (user_id, badge_id, awarded_by)
    VALUES (p_user_id, v_badge_id, p_user_id)
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;
END;
$$;

-- TRIGGER 1: Award archetype-unlock on onboarding complete
CREATE OR REPLACE FUNCTION public.trigger_archetype_badge()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.onboarding_complete = true AND OLD.onboarding_complete = false THEN
    PERFORM award_badge(NEW.user_id, 'archetype-unlock');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_onboarding_complete ON profiles;
CREATE TRIGGER on_onboarding_complete
  AFTER UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_archetype_badge();

-- TRIGGER 2: Award ritual badges on completion
CREATE OR REPLACE FUNCTION public.trigger_ritual_badges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_streak integer;
BEGIN
  SELECT ritual_streak INTO v_streak FROM profiles WHERE user_id = NEW.user_id;

  IF v_streak >= 1 THEN
    PERFORM award_badge(NEW.user_id, 'first-ritual');
  END IF;
  IF v_streak >= 5 THEN
    PERFORM award_badge(NEW.user_id, 'ritual-streak-5');
  END IF;
  IF v_streak >= 10 THEN
    PERFORM award_badge(NEW.user_id, 'ritual-streak-10');
  END IF;
  IF v_streak >= 25 THEN
    PERFORM award_badge(NEW.user_id, 'ritual-streak-25');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_ritual_completion ON ritual_completions;
CREATE TRIGGER on_ritual_completion
  AFTER INSERT ON ritual_completions
  FOR EACH ROW EXECUTE FUNCTION trigger_ritual_badges();

-- TRIGGER 3: Award course-complete on enrollment completion
CREATE OR REPLACE FUNCTION public.trigger_course_badge()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
    PERFORM award_badge(NEW.user_id, 'course-complete');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_course_complete ON course_enrollments;
CREATE TRIGGER on_course_complete
  AFTER UPDATE ON course_enrollments
  FOR EACH ROW EXECUTE FUNCTION trigger_course_badge();

-- TRIGGER 4: Award first-post and first-win badges
CREATE OR REPLACE FUNCTION public.trigger_first_post_badge()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post_count integer;
BEGIN
  SELECT COUNT(*) INTO v_post_count FROM posts WHERE author_id = NEW.author_id;

  IF v_post_count = 1 THEN
    PERFORM award_badge(NEW.author_id, 'first-post');
  END IF;

  IF NEW.post_type = 'win' THEN
    PERFORM award_badge(NEW.author_id, 'first-win');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_first_post ON posts;
CREATE TRIGGER on_first_post
  AFTER INSERT ON posts
  FOR EACH ROW EXECUTE FUNCTION trigger_first_post_badge();

-- Ensure user_badges has proper insert policy for the SECURITY DEFINER functions
-- The existing insert policy only allows admin/moderator, but award_badge runs as SECURITY DEFINER
-- so it bypasses RLS. No policy change needed.
