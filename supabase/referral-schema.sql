-- HyperScripter — Referral & affiliate schema
-- Run in Supabase SQL Editor AFTER schema.sql

-- ---------------------------------------------------------------------------
-- users.referral_code
-- ---------------------------------------------------------------------------

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS referral_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS users_referral_code_unique_idx
  ON public.users (referral_code)
  WHERE referral_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS users_referral_code_idx
  ON public.users (referral_code);

-- ---------------------------------------------------------------------------
-- referrals
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.referrals (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id  TEXT        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referred_user_id  TEXT        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referral_code     TEXT        NOT NULL,
  status            TEXT        NOT NULL DEFAULT 'completed'
                                CHECK (status IN ('pending', 'completed')),
  reward_credits    INTEGER     NOT NULL DEFAULT 0 CHECK (reward_credits >= 0),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT referrals_referred_user_unique UNIQUE (referred_user_id),
  CONSTRAINT referrals_no_self CHECK (referrer_user_id <> referred_user_id)
);

CREATE INDEX IF NOT EXISTS referrals_referrer_user_id_idx
  ON public.referrals (referrer_user_id);

CREATE INDEX IF NOT EXISTS referrals_referral_code_idx
  ON public.referrals (referral_code);

CREATE INDEX IF NOT EXISTS referrals_created_at_idx
  ON public.referrals (created_at DESC);

-- ---------------------------------------------------------------------------
-- affiliate_payouts
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.affiliate_payouts (
  id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT           NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referral_id UUID           REFERENCES public.referrals(id) ON DELETE SET NULL,
  amount      NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  status      TEXT           NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'paid')),
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT now(),
  paid_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS affiliate_payouts_user_id_idx
  ON public.affiliate_payouts (user_id);

CREATE INDEX IF NOT EXISTS affiliate_payouts_status_idx
  ON public.affiliate_payouts (status);

CREATE INDEX IF NOT EXISTS affiliate_payouts_created_at_idx
  ON public.affiliate_payouts (created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS affiliate_payouts_referral_unique_idx
  ON public.affiliate_payouts (referral_id)
  WHERE referral_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service access referrals" ON public.referrals;
CREATE POLICY "Service access referrals"
  ON public.referrals FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service access affiliate payouts" ON public.affiliate_payouts;
CREATE POLICY "Service access affiliate payouts"
  ON public.affiliate_payouts FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
