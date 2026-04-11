
-- 1. notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  comments_enabled BOOLEAN DEFAULT true,
  reactions_enabled BOOLEAN DEFAULT true,
  mentions_enabled BOOLEAN DEFAULT true,
  badges_enabled BOOLEAN DEFAULT true,
  event_reminders_enabled BOOLEAN DEFAULT true,
  ritual_reminders_enabled BOOLEAN DEFAULT true,
  system_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif_prefs_select_own" ON notification_preferences
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_prefs_insert_own" ON notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notif_prefs_update_own" ON notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- 2. Trigger: comment notification
CREATE OR REPLACE FUNCTION trigger_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_post_author UUID;
  v_commenter_name TEXT;
BEGIN
  SELECT author_id INTO v_post_author FROM posts WHERE id = NEW.post_id;
  SELECT display_name INTO v_commenter_name FROM profiles WHERE user_id = NEW.author_id;

  IF v_post_author IS NOT NULL AND v_post_author != NEW.author_id THEN
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      v_post_author,
      'comment',
      'New comment on your post',
      COALESCE(v_commenter_name, 'Someone') || ' commented on your post.',
      '/community'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_comment_created ON comments;
CREATE TRIGGER on_comment_created
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION trigger_comment_notification();

-- 3. Trigger: reaction notification
CREATE OR REPLACE FUNCTION trigger_reaction_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_post_author UUID;
  v_reactor_name TEXT;
BEGIN
  SELECT author_id INTO v_post_author FROM posts WHERE id = NEW.post_id;
  SELECT display_name INTO v_reactor_name FROM profiles WHERE user_id = NEW.user_id;

  IF v_post_author IS NOT NULL AND v_post_author != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      v_post_author,
      'reaction',
      'Someone reacted to your post',
      COALESCE(v_reactor_name, 'Someone') || ' reacted to your post.',
      '/community'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_post_reaction ON post_reactions;
CREATE TRIGGER on_post_reaction
  AFTER INSERT ON post_reactions
  FOR EACH ROW EXECUTE FUNCTION trigger_reaction_notification();

-- 4. Trigger: badge notification
CREATE OR REPLACE FUNCTION trigger_badge_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_badge_name TEXT;
BEGIN
  SELECT name INTO v_badge_name FROM badges WHERE id = NEW.badge_id;

  INSERT INTO notifications (user_id, type, title, message, link)
  VALUES (
    NEW.user_id,
    'badge',
    'Badge unlocked!',
    'You earned the ' || COALESCE(v_badge_name, 'a') || ' badge.',
    '/members'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_badge_awarded ON user_badges;
CREATE TRIGGER on_badge_awarded
  AFTER INSERT ON user_badges
  FOR EACH ROW EXECUTE FUNCTION trigger_badge_notification();

-- 5. Enable realtime on notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
