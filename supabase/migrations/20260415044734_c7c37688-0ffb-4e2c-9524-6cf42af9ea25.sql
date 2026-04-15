
-- Retroactively award badges using the award_badge function
-- Welcome badge for all existing profiles
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT user_id FROM profiles LOOP
    PERFORM award_badge(r.user_id, 'welcome');
  END LOOP;
END;
$$;

-- Archetype badge for users who completed onboarding
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT user_id FROM profiles WHERE onboarding_complete = true LOOP
    PERFORM award_badge(r.user_id, 'archetype-unlock');
  END LOOP;
END;
$$;

-- First ritual badge for users with any ritual completion
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT DISTINCT user_id FROM ritual_completions LOOP
    PERFORM award_badge(r.user_id, 'first-ritual');
  END LOOP;
END;
$$;

-- Ritual streak badges
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT user_id, ritual_streak FROM profiles WHERE ritual_streak >= 5 LOOP
    PERFORM award_badge(r.user_id, 'ritual-streak-5');
    IF r.ritual_streak >= 10 THEN
      PERFORM award_badge(r.user_id, 'ritual-streak-10');
    END IF;
    IF r.ritual_streak >= 25 THEN
      PERFORM award_badge(r.user_id, 'ritual-streak-25');
    END IF;
  END LOOP;
END;
$$;

-- First post badge
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT DISTINCT author_id FROM posts LOOP
    PERFORM award_badge(r.author_id, 'first-post');
  END LOOP;
END;
$$;

-- First course badge
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT DISTINCT user_id FROM course_enrollments LOOP
    PERFORM award_badge(r.user_id, 'first-course');
  END LOOP;
END;
$$;

-- Course complete badge
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT DISTINCT user_id FROM course_enrollments WHERE completed_at IS NOT NULL LOOP
    PERFORM award_badge(r.user_id, 'course-complete');
  END LOOP;
END;
$$;
