ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS fms_lead_type TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS fms_rationale TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS fms_confidence TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS fms_last_scored_at TIMESTAMP WITH TIME ZONE;

-- Validation trigger for fms_confidence
CREATE OR REPLACE FUNCTION public.validate_fms_confidence()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.fms_confidence IS NOT NULL AND NEW.fms_confidence NOT IN ('high', 'medium', 'low') THEN
    RAISE EXCEPTION 'Invalid fms_confidence value: %', NEW.fms_confidence;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_fms_confidence ON public.profiles;
CREATE TRIGGER check_fms_confidence
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_fms_confidence();