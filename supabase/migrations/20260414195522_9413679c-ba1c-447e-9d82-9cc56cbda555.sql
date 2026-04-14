-- Add unique constraint on lesson_progress for (user_id, lesson_id) to support upsert
CREATE UNIQUE INDEX IF NOT EXISTS lesson_progress_user_lesson_key
  ON public.lesson_progress (user_id, lesson_id);