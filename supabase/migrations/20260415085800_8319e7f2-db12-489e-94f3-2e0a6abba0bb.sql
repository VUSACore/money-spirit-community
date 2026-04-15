-- Fix threads table permissions (RLS still controls actual access)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.threads TO authenticated;
GRANT SELECT ON public.threads TO anon;

-- Fix platform_settings table permissions (RLS restricts to admin only)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_settings TO authenticated;