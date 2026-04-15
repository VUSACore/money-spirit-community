
-- Ritual completions: update streak + award ritual badges
CREATE TRIGGER on_ritual_completion_streak
  AFTER INSERT ON public.ritual_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ritual_streak();

CREATE TRIGGER on_ritual_completion_badges
  AFTER INSERT ON public.ritual_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_ritual_badges();

-- Course enrollment: award course-complete badge
CREATE TRIGGER on_course_complete_badge
  AFTER UPDATE ON public.course_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_course_badge();

-- Posts: award first-post / first-win badge
CREATE TRIGGER on_post_insert_badge
  AFTER INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_first_post_badge();

-- Profiles: award archetype badge on onboarding complete
CREATE TRIGGER on_onboarding_archetype_badge
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_archetype_badge();

-- Comments: notification to post author
CREATE TRIGGER on_comment_notify
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_comment_notification();

-- Reactions: notification to post author
CREATE TRIGGER on_reaction_notify
  AFTER INSERT ON public.post_reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_reaction_notification();

-- User badges: notification on badge award
CREATE TRIGGER on_badge_awarded_notify
  AFTER INSERT ON public.user_badges
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_badge_notification();

-- Welcome badge on profile creation
CREATE OR REPLACE FUNCTION public.trigger_welcome_badge()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  PERFORM award_badge(NEW.user_id, 'welcome');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_welcome_badge
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_welcome_badge();

-- First course started badge on enrollment
CREATE OR REPLACE FUNCTION public.trigger_first_course_badge()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  PERFORM award_badge(NEW.user_id, 'first-course');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_course_enroll_badge
  AFTER INSERT ON public.course_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_first_course_badge();
