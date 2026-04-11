
-- Extend pathway_type enum
ALTER TYPE pathway_type ADD VALUE IF NOT EXISTS 'giver';
ALTER TYPE pathway_type ADD VALUE IF NOT EXISTS 'keeper';
ALTER TYPE pathway_type ADD VALUE IF NOT EXISTS 'rebel';
ALTER TYPE pathway_type ADD VALUE IF NOT EXISTS 'seeker';
ALTER TYPE pathway_type ADD VALUE IF NOT EXISTS 'achiever';

-- Add new columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS archetype_score JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS life_stage TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fms_score INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fms_referral_eligible BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fms_signal_type TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fms_referral_dismissed BOOLEAN DEFAULT false;

-- Validation trigger for life_stage
CREATE OR REPLACE FUNCTION public.validate_life_stage()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.life_stage IS NOT NULL AND NEW.life_stage NOT IN ('under_30', '30_to_40', '40_to_50', '50_plus') THEN
    RAISE EXCEPTION 'Invalid life_stage value: %', NEW.life_stage;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_profiles_life_stage
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION public.validate_life_stage();

-- Add columns to pathways table
ALTER TABLE pathways ADD COLUMN IF NOT EXISTS icon_slug TEXT;
ALTER TABLE pathways ADD COLUMN IF NOT EXISTS accent_colour TEXT;
ALTER TABLE pathways ADD COLUMN IF NOT EXISTS sort_order INTEGER;
