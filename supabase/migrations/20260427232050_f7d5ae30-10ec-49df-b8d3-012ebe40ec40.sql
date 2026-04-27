CREATE TABLE public.user_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  approx_lat NUMERIC NOT NULL,
  approx_lng NUMERIC NOT NULL,
  country TEXT,
  region TEXT,
  city TEXT,
  pathway_type public.pathway_type,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view aggregated points (lat/lng are already approximate)
CREATE POLICY "user_locations_select_all"
ON public.user_locations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "user_locations_insert_own"
ON public.user_locations FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_locations_update_own"
ON public.user_locations FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_user_locations_country ON public.user_locations(country);