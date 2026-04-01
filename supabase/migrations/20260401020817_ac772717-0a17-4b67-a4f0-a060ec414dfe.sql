-- Rituals table
CREATE TABLE public.rituals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  prompt text NOT NULL,
  week_of date NOT NULL,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rituals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rituals_select_published" ON public.rituals FOR SELECT TO authenticated USING (published = true);

-- Ritual completions table
CREATE TABLE public.ritual_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  ritual_id uuid REFERENCES public.rituals(id) ON DELETE CASCADE NOT NULL,
  reflection text,
  shared_to_feed boolean NOT NULL DEFAULT false,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, ritual_id)
);

ALTER TABLE public.ritual_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "completions_select_own" ON public.ritual_completions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "completions_insert_own" ON public.ritual_completions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);