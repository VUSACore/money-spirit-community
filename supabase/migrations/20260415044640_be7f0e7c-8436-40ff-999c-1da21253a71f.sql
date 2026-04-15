
ALTER TABLE public.user_badges
  ADD CONSTRAINT user_badges_user_id_badge_id_key UNIQUE (user_id, badge_id);
