
-- Trigger: notify the thread author when someone replies to their thread
CREATE OR REPLACE FUNCTION public.trigger_thread_reply_notification()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_thread_author UUID;
  v_thread_title TEXT;
  v_replier_name TEXT;
BEGIN
  SELECT author_id, title INTO v_thread_author, v_thread_title
  FROM threads WHERE id = NEW.thread_id;

  SELECT display_name INTO v_replier_name
  FROM profiles WHERE user_id = NEW.author_id;

  IF v_thread_author IS NOT NULL AND v_thread_author != NEW.author_id THEN
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      v_thread_author,
      'comment',
      'New reply on your thread',
      COALESCE(v_replier_name, 'Someone') || ' replied to "' || LEFT(v_thread_title, 60) || '".',
      '/forums'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_thread_reply_notify
  AFTER INSERT ON public.thread_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_thread_reply_notification();
