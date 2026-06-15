-- HyperScripter — Affiliate payment methods & payout notes
-- Run in Supabase SQL Editor AFTER referral-schema.sql

-- ---------------------------------------------------------------------------
-- affiliate_payment_methods (one row per user)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.affiliate_payment_methods (
  user_id           TEXT        PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  preferred_method  TEXT        CHECK (preferred_method IS NULL OR preferred_method IN (
                                  'paypal', 'bank', 'wise', 'binance', 'usdt'
                                )),
  paypal_email      TEXT,
  bank_account      TEXT,
  wise_email        TEXT,
  binance_uid       TEXT,
  usdt_wallet       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS affiliate_payment_methods_preferred_method_idx
  ON public.affiliate_payment_methods (preferred_method);

-- ---------------------------------------------------------------------------
-- affiliate_payouts — admin payment notes
-- ---------------------------------------------------------------------------

ALTER TABLE public.affiliate_payouts
  ADD COLUMN IF NOT EXISTS payment_notes TEXT;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.affiliate_payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service access affiliate payment methods" ON public.affiliate_payment_methods;
CREATE POLICY "Service access affiliate payment methods"
  ON public.affiliate_payment_methods FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
