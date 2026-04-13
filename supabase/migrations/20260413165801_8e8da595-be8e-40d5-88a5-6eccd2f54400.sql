
-- Step 1: Add new columns to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cover_url TEXT,
  ADD COLUMN IF NOT EXISTS country_of_origin TEXT,
  ADD COLUMN IF NOT EXISTS years_in_australia TEXT,
  ADD COLUMN IF NOT EXISTS marital_status TEXT,
  ADD COLUMN IF NOT EXISTS number_of_children INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS employment_type TEXT,
  ADD COLUMN IF NOT EXISTS financial_goals TEXT[],
  ADD COLUMN IF NOT EXISTS interests TEXT[],
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS tiktok_url TEXT,
  ADD COLUMN IF NOT EXISTS snapchat_username TEXT,
  ADD COLUMN IF NOT EXISTS facebook_url TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS show_social_links BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_marital_status BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_children BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS post_count INTEGER DEFAULT 0;

-- Validation trigger for years_in_australia
CREATE OR REPLACE FUNCTION public.validate_years_in_australia()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.years_in_australia IS NOT NULL AND NEW.years_in_australia NOT IN (
    'less_than_1', '1_to_2', '2_to_5', '5_to_10', 'more_than_10'
  ) THEN
    RAISE EXCEPTION 'Invalid years_in_australia value: %', NEW.years_in_australia;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_years_in_australia_trigger ON profiles;
CREATE TRIGGER validate_years_in_australia_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_years_in_australia();

-- Validation trigger for marital_status
CREATE OR REPLACE FUNCTION public.validate_marital_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.marital_status IS NOT NULL AND NEW.marital_status NOT IN (
    'single', 'married', 'de_facto', 'divorced', 'widowed', 'prefer_not_to_say'
  ) THEN
    RAISE EXCEPTION 'Invalid marital_status value: %', NEW.marital_status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_marital_status_trigger ON profiles;
CREATE TRIGGER validate_marital_status_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_marital_status();

-- Validation trigger for employment_type
CREATE OR REPLACE FUNCTION public.validate_employment_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.employment_type IS NOT NULL AND NEW.employment_type NOT IN (
    'employed', 'self_employed', 'business_owner', 'student', 'not_working', 'prefer_not_to_say'
  ) THEN
    RAISE EXCEPTION 'Invalid employment_type value: %', NEW.employment_type;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_employment_type_trigger ON profiles;
CREATE TRIGGER validate_employment_type_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_employment_type();

-- Step 2: Create profile_photos table
CREATE TABLE IF NOT EXISTS public.profile_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profile_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_photos_select_all" ON public.profile_photos
  FOR SELECT USING (true);

CREATE POLICY "profile_photos_insert_own" ON public.profile_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profile_photos_update_own" ON public.profile_photos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "profile_photos_delete_own" ON public.profile_photos
  FOR DELETE USING (auth.uid() = user_id);

-- Step 3: Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "avatar_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatar_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatar_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatar_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for covers
CREATE POLICY "cover_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'covers');

CREATE POLICY "cover_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'covers'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "cover_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'covers'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "cover_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'covers'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for profile-photos
CREATE POLICY "profile_photos_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-photos');

CREATE POLICY "profile_photos_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "profile_photos_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "profile_photos_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
