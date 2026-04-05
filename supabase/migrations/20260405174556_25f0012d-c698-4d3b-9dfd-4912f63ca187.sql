-- Drop dependent index first
DROP INDEX IF EXISTS public.profiles_display_name_trgm_idx;

-- Move pg_trgm to extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;
DROP EXTENSION IF EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

-- Recreate the index using the extensions schema operator class
CREATE INDEX profiles_display_name_trgm_idx ON public.profiles USING gin (display_name extensions.gin_trgm_ops);