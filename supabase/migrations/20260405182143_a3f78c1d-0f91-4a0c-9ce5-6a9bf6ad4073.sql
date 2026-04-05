GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON public.posts, public.profiles, public.forums, public.events, public.rituals, public.courses, public.lessons, public.badges TO anon;

GRANT INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT INSERT ON public.post_reactions, public.ritual_completions, public.course_enrollments, public.event_tickets TO authenticated;

DROP POLICY IF EXISTS posts_anon_select ON public.posts;
CREATE POLICY posts_anon_select
ON public.posts
FOR SELECT
TO anon
USING (hidden = false);

DROP POLICY IF EXISTS profiles_anon_select ON public.profiles;
CREATE POLICY profiles_anon_select
ON public.profiles
FOR SELECT
TO anon
USING (visible_in_directory = true);

DROP POLICY IF EXISTS forums_anon_select ON public.forums;
CREATE POLICY forums_anon_select
ON public.forums
FOR SELECT
TO anon
USING (true);

DROP POLICY IF EXISTS events_anon_select ON public.events;
CREATE POLICY events_anon_select
ON public.events
FOR SELECT
TO anon
USING (published = true);

DROP POLICY IF EXISTS rituals_anon_select ON public.rituals;
CREATE POLICY rituals_anon_select
ON public.rituals
FOR SELECT
TO anon
USING (published = true);

DROP POLICY IF EXISTS courses_anon_select ON public.courses;
CREATE POLICY courses_anon_select
ON public.courses
FOR SELECT
TO anon
USING (published = true);

DROP POLICY IF EXISTS lessons_anon_select ON public.lessons;
CREATE POLICY lessons_anon_select
ON public.lessons
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1
    FROM public.courses
    WHERE courses.id = lessons.course_id
      AND courses.published = true
  )
);

DROP POLICY IF EXISTS badges_anon_select ON public.badges;
CREATE POLICY badges_anon_select
ON public.badges
FOR SELECT
TO anon
USING (true);

DROP POLICY IF EXISTS event_tickets_insert ON public.event_tickets;
CREATE POLICY event_tickets_insert
ON public.event_tickets
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());