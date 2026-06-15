-- Rate limit counters (fallback when Upstash Redis is not configured)
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.rate_limit_counters (
  bucket_key   TEXT        NOT NULL,
  window_id    BIGINT      NOT NULL,
  count        INTEGER     NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (bucket_key, window_id)
);

CREATE INDEX IF NOT EXISTS rate_limit_counters_updated_at_idx
  ON public.rate_limit_counters (updated_at);

ALTER TABLE public.rate_limit_counters ENABLE ROW LEVEL SECURITY;
-- No policies: service role only (server API access)

CREATE OR REPLACE FUNCTION public.increment_rate_limit_counter(
  p_bucket_key TEXT,
  p_window_id BIGINT,
  p_limit INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO public.rate_limit_counters (bucket_key, window_id, count)
  VALUES (p_bucket_key, p_window_id, 1)
  ON CONFLICT (bucket_key, window_id)
  DO UPDATE SET
    count = public.rate_limit_counters.count + 1,
    updated_at = now()
  RETURNING count INTO v_count;

  RETURN jsonb_build_object(
    'count', v_count,
    'success', v_count <= p_limit
  );
END;
$$;

NOTIFY pgrst, 'reload schema';
