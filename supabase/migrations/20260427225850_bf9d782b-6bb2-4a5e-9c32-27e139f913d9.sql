-- Inline updated_at trigger function for affiliates
CREATE OR REPLACE FUNCTION public.set_updated_at_affiliates()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.affiliates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  commission_percent NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (commission_percent >= 0 AND commission_percent <= 100),
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_affiliates_code ON public.affiliates(code);

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "affiliates_admin_all" ON public.affiliates
  FOR ALL TO authenticated
  USING (auth_user_role() = 'admin'::user_role)
  WITH CHECK (auth_user_role() = 'admin'::user_role);

CREATE POLICY "affiliates_public_lookup" ON public.affiliates
  FOR SELECT TO anon, authenticated
  USING (active = true);

CREATE TRIGGER trg_affiliates_updated_at
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_affiliates();

CREATE TABLE public.affiliate_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  signed_up_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  commission_paid BOOLEAN NOT NULL DEFAULT false,
  commission_amount_pence INTEGER NOT NULL DEFAULT 0,
  paid_at TIMESTAMPTZ,
  paid_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX idx_affiliate_referrals_affiliate_id ON public.affiliate_referrals(affiliate_id);

ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "affiliate_referrals_admin_all" ON public.affiliate_referrals
  FOR ALL TO authenticated
  USING (auth_user_role() = 'admin'::user_role)
  WITH CHECK (auth_user_role() = 'admin'::user_role);

CREATE POLICY "affiliate_referrals_own_select" ON public.affiliate_referrals
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "affiliate_referrals_own_insert" ON public.affiliate_referrals
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

ALTER TABLE public.profiles
  ADD COLUMN referred_by_affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE SET NULL,
  ADD COLUMN affiliate_discount_percent NUMERIC(5,2) DEFAULT 0;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliates TO authenticated;
GRANT SELECT ON public.affiliates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_referrals TO authenticated;