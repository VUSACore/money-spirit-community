-- Fix missing table-level GRANTs for authenticated role.
-- RLS policies are already in place on all tables and control actual row access.
-- These GRANTs simply allow the role to attempt operations; RLS decides the outcome.

-- thread_replies: members need to read, create, edit, delete replies
GRANT SELECT, INSERT, UPDATE, DELETE ON public.thread_replies TO authenticated;
GRANT SELECT ON public.thread_replies TO anon;

-- thread_reply_upvotes: members need to read, create, remove upvotes
GRANT SELECT, INSERT, DELETE ON public.thread_reply_upvotes TO authenticated;

-- comments: members need to read, create, edit, delete comments
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;

-- content_reports: members need to create, admins need to read/update
GRANT SELECT, INSERT, UPDATE ON public.content_reports TO authenticated;

-- recording_consents: members need to create and read their own consents
GRANT SELECT, INSERT ON public.recording_consents TO authenticated;

-- audit_logs: admins/mods need to create and read audit entries
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;

-- notifications: members need to read and mark as read, triggers need insert
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;

-- notification_preferences: members need to read, create, update their prefs
GRANT SELECT, INSERT, UPDATE ON public.notification_preferences TO authenticated;

-- course_enrollments: members need to update their own enrollments
GRANT UPDATE ON public.course_enrollments TO authenticated;

-- lesson_progress: members need to create and update their progress
GRANT SELECT, INSERT, UPDATE ON public.lesson_progress TO authenticated;

-- profile_photos: members need full CRUD on their own photos
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_photos TO authenticated;

-- legacy_goals: members need full CRUD on their own goals
GRANT SELECT, INSERT, UPDATE, DELETE ON public.legacy_goals TO authenticated;

-- family_circles: members need full CRUD
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_circles TO authenticated;

-- family_circle_members: members need full CRUD
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_circle_members TO authenticated;

-- family_rituals: members need full CRUD
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_rituals TO authenticated;

-- family_ritual_completions: members need full CRUD
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_ritual_completions TO authenticated;

-- event_waitlist: members need to read, join, leave waitlists
GRANT SELECT, INSERT, DELETE ON public.event_waitlist TO authenticated;

-- post_reactions: members need to remove reactions
GRANT DELETE ON public.post_reactions TO authenticated;

-- Ensure future tables in public schema get proper defaults
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;