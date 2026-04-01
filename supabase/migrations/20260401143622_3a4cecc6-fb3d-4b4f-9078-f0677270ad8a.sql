
-- User roles table (secure, separate from profiles)
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS on user_roles: only admins can read
CREATE POLICY "admin_select_roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin function to update profile role field (bypasses the trigger)
CREATE OR REPLACE FUNCTION public.admin_update_profile_role(_target_id uuid, _new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;
  UPDATE profiles SET role = _new_role WHERE id = _target_id;
END;
$$;

-- Admin policies: allow admins to manage events
CREATE POLICY "admin_insert_events" ON public.events
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_update_events" ON public.events
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies: allow admins to manage rituals
CREATE POLICY "admin_insert_rituals" ON public.rituals
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_update_rituals" ON public.rituals
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin: select all event_tickets
CREATE POLICY "admin_select_tickets" ON public.event_tickets
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin: select all rituals (including unpublished)
CREATE POLICY "admin_select_all_rituals" ON public.rituals
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
