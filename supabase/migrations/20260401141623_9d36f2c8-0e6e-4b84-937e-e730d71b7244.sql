
-- Events table
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  event_date timestamptz NOT NULL,
  location_name text,
  is_virtual boolean NOT NULL DEFAULT false,
  price_pence integer NOT NULL DEFAULT 0,
  capacity integer,
  stripe_price_id text,
  published boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_select_published" ON public.events
  FOR SELECT TO public USING (published = true);

-- Event tickets table
CREATE TABLE public.event_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_session_id text,
  status text NOT NULL DEFAULT 'active',
  purchased_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.event_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tickets_select_own" ON public.event_tickets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "tickets_insert_own" ON public.event_tickets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
