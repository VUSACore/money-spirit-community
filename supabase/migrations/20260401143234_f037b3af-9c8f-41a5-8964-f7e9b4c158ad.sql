
CREATE TABLE public.event_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

ALTER TABLE public.event_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "interests_select_own" ON public.event_interests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "interests_insert_own" ON public.event_interests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
